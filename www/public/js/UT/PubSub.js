// UT.PubSub
// Can create multiple PubSub objects
// Can use the static default PubSub object (UT.PubSub.main)

var UT = UT || {};

/**
 * @constructor
 */
UT.PubSub = function() {};

UT.PubSub.create = function() {
	var res = new UT.PubSub();
	res.init();
	return res;
};

UT.PubSub.prototype.init = function() {
	// the collection of all events registered on this PubSub (key=eventID, value = object)
	this._events = {};			// eventID: { subscriptions: ... }
	
	// collection of handles and objects (key is handle, value is eventObj)
	this._handles = {};			// eventHandle: { eventID:eventID, priority:N }
	
	// a unique value to identify subscribed-to events (key into _handles)
	this._nextHandle = 1;
};

/**
 * Subscribe to an event by name
 * @param {*} eventID  The id(name) of the event to listen/watch for (usually a string)
 * @param (Function) fn  The function to call when the eventID is published/fired
 * @param {Object=} obj  The object that the function is a part of (the "this" ptr for the function)
 * @param {Number=} priorty  Way of ordering who gets informed of the event first or last (defaults to 5, valid 0-9)
 * @return {*}  Handle to your subscribed-to event
 */
UT.PubSub.prototype.subscribe = function(eventID, fn, obj, priority) {
	var returnHandle;
	var evt;
	var evtData;
	if (!priority || typeof priority != 'number') priority = 5;
	if (priority < 0) priority = 0;
	if (priority > 9) priority = 9;

	// create handle data to return
	returnHandle = this._nextHandle;
	this._nextHandle++;
	evtData = { priority:priority, eventID:eventID };	// eventID:eventID, priority:N
	this._handles[returnHandle] = evtData;

	// 1) find or create the event
	evt = this._events[eventID];
	if (!evt) {
		// not found, create the event
		this._events[eventID] = {};
		evt = this._events[eventID];
		evt.subscribers = {};			// collection of functions to call-on-publish
		evt.subscribers.pri = [];		// priority-ordered functions
	}
	
	// 2) add to subscriber list of the event
	if (!evt.subscribers.pri[priority]) {
		evt.subscribers.pri[priority] = [];
	}
	evt.subscribers.pri[priority].push( { fn:fn, obj:obj, handle:returnHandle } );

	return returnHandle;
};

/**
 * Setup to allow veto-power over a published event (allows for cancelling of events)
 * @param {*} handle  The event-handle to a previously subscribed-to event
 * @param {Function} fn  The function to call to check if the event should be veto'ed
 * @param {Object=} obj  The object that the function is a part of (the "this" ptr for the function)
 * example:  var doVeto = fn(event, justChecking);
 *		justChecking = a boolean.  true means someone called checkEvent, not publish.
 */
UT.PubSub.prototype.allowVeto = function(handle, fn, obj) {
	// 1) find event
	// 2) add to veto list
};

/**
 * unsubscribe.  quit listening for an eventID
 * @param {*} handle  The event-handle to a previously subscribed-to event
 */
UT.PubSub.prototype.unsubscribe = function(handle) {
	var found;			// the found info object
	var evtData;		// the event data: { eventID:eventID, priority:N, evt:_events[eventID] }
	var priority;		// event priority
	var evt;			// the actual found event object: { subscribers:... }
	var arr;			// array of subscribers for this event and priority
	var idx;			// inex in array of the event to unsubscribe
	
	// 1) find event
	found = this._findEventViaHandle(handle);
	if (found) {
		evtData = found.evtData;
		// 2) remove "handle" from subscribers
		if (evtData && evtData.eventID) {
			evt = this._events[evtData.eventID];
			idx = found.idx;
			// .event:eventName, priority:N, .evt:_events[eventName]
			priority = evtData.priority;
			if (evt && evt.subscribers && evt.subscribers.pri && evt.subscribers.pri[priority]) {
				arr = evt.subscribers.pri[priority];
				if (arr.length <= 1) {
					// removing last subscriber of this event and priority, delete entire priority collection
					delete evt.subscribers.pri[priority];
				} else {
					// remove this one subscription from the array of this priority
					arr.splice(idx, 1);
				}
			}
		}
		// 3) remove "handle" from vetoers
		// @TODO ...
	}
	// last) remove the handle data from _handles
	delete this._handles[handle];
};

/**
 * check if an event will be processed (if the event has any subscribers)
 * @param {*} eventID  The event to check
 * @return {boolean}  true means the event IS VALID (someone is subscribed, and won't be veto'ed)
 */
UT.PubSub.prototype.checkEvent = function(eventID) {
	var evt;				// event object
	var pri;				// collection of subscribers for a single priority
	var priority;			// a priority value
	var arr;				// array of subscribers for a single priority
	var idx;				// index into array
	var oneSub;				// one subscription object
	// 1) find event
	evt = this._events[eventID];
	if (evt && evt.subscribers && evt.subscribers.pri) {
		pri = evt.subscribers.pri;
		for(priority in pri) {
			if (pri.hasOwnProperty(priority)) {
				arr = pri[priority];
				for(idx=0; idx<arr.length; idx++) {
					oneSub = arr[idx];
					if (oneSub && oneSub.fn) {
						// @TODO: IF a veto here, ask them if they will veto this?
						return true;
					}
				}
			}
		}
	}
	// 2) check veto
	return false;
};

/**
 * publish/trigger/fire an event
 * @param {*} eventID  The event to cause/publish/trigger/fire right now
 * @param {*} args  argument with the event (usually a JSON object)
 * @return {number}  The number of subscribers that got the event (0 means no one, -1 means it was veto'ed)
 */
UT.PubSub.prototype.publish = function(eventID, args) {
	var returnN = 0;		// total subscribers that got this event (-1 means it was veto'ed)
	var evt;				// event object
	var pri;				// collection of subscribers for a single priority
	var priority;			// a priority value
	var arr;				// array of subscribers for a single priority
	var idx;				// index into array
	var maxIdx;				// length of the array
	var oneSub;				// one subscription-object
	var toCall = [];		// array of subscription-obects to call (in order)
	// 1) find event
	evt = this._events[eventID];
	if (evt && evt.subscribers && evt.subscribers.pri) {
		pri = evt.subscribers.pri;
		// walk every priority
		maxIdx = pri.length;
		for(priority=0; priority<maxIdx; priority++) {
			arr = pri[priority];
			if (arr) {
				// walk every subscription in this priority
				for(idx=0; idx<arr.length; idx++) {
					oneSub = arr[idx];
					if (oneSub && oneSub.fn) {
						toCall.push(oneSub);
					}
					// @TODO: check VETO (return -1 if veto'ed)
				}
			}
		}
	}
	for(idx=0; idx<toCall.length; idx++) {
		oneSub = toCall[idx];
		// call the function(fn) within the objec(oneSub,obj) with the arg(args)
		oneSub.fn.call(oneSub.obj, args);
		returnN += 1;
	}
	return returnN;
};

/**
 * find information, given an event handle
 * @private
 * @param {*} handle  The event-handle to a previously subscribed-to event
 * @return {?Object}  {  evtData:eventData, idx: index of this handle in the array }
 */
UT.PubSub.prototype._findEventViaHandle = function(handle) {
	var found = undefined;
	var evtData = this._handles[handle];		// { eventID:eventID, priority: N }
	var eventID;								// string (name of the event)
	var evt;									// event object { subscribers: }
	var priority;								// number priority of the requested event
	var arr;									// array of subscriptions to event with this priority
	var idx;									// index in array of this specific subscription-handle
	if (evtData) {
		// create the found-object to return
		found = {};
		found.evtData = evtData;
		eventID = evtData.eventID;
		evt = this._events[eventID];
		priority = evtData.priority;
		arr = evt.subscribers.pri[priority];
		if (arr) {
			// WALK the array looking for handle
			for(idx=0; idx<arr.length; idx++) {
				if (arr[idx].handle === handle) {
					// FOUND
					found.idx = idx;
					break;
				}
			}
		}
	}
	return found;
};

/**
 * dump the entire subscription info to the console
 */
UT.PubSub.prototype.debugDump = function() {
	var eventID;			// a single eventID
	var evt;				// event object
	var pri;				// collection of subscribers for a single priority
	var priority;			// a priority value
	var arr;				// array of subscribers for a single priority
	var idx;				// index into array
	var oneSub;				// one subscription-object
	var handle;				// handle to a single subscription
	var evtData;			// { eventID:eventID, priority: N }
	// EVENTS
	this.log("PubSub EVENTS:");
	for(eventID in this._events) {
		if (this._events.hasOwnProperty(eventID)) {
			this.log(".. eventID:"+eventID);
			evt = this._events[eventID];
			if (evt && evt.subscribers && evt.subscribers.pri) {
				pri = evt.subscribers.pri;
				// walk every priority
				for(priority in pri) {
					if (pri.hasOwnProperty(priority)) {
						this.log(".. .. priority:"+priority);
						arr = pri[priority];
						// walk every subscription in this priority
						for(idx=0; idx<arr.length; idx++) {
							oneSub = arr[idx];
							this.log(".. .. .. "+idx+":  handle="+oneSub.handle);
						}
					}
				}
			}
		}
	}
	// HANDLES
	this.log("PubSub HANDLES:");
	for(handle in this._handles) {
		if (this._handles.hasOwnProperty(handle)) {
			evtData = this._handles[handle];			// { eventID:eventID, priority: N }			
			this.log(".. handle:"+handle+"  eventID="+evtData.eventID+"  priority="+evtData.priority);
		}
	}
};
UT.PubSub.prototype.log = function(msg) {
	console.log(msg);
};

