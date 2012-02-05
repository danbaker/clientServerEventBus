// UT.EventBus
// Can create multiple EventBus objects
// Can use the static default EventBus object (UT.EventBus.main)

// @TODO:
// 1) Convert this file into UT.PubSub -- a general purpose Pub/Sub utility
// 2) Create a UT.EventBus -- a specialized Event handler:
//		*) All eventID's are strings
//		*) When an eventID is published, an eventObject is created and processed
//		*) an eventObject can be marked as "processed"
//		*) EventBus HAS-A UT.PubSub


if (!UT) UT = {};

/**
 * @constructor
 */
UT.EventBus = function() {};

UT.EventBus.create = function() {
	var res = new UT.EventBus();
	res.init();
	return res;
};

UT.EventBus.prototype.init = function() {
	// the collection of all events registered on this EventBus (key=event, value = object)
	this._events = {};
	
	// collection of handles and objects
	this._handles = [];
	
	// a unique value to identify subscribed-to events (index into _handles)
	this._nextHandle = 1;
};

/**
 * Subscribe to an event
 * @param {*} event  The event to listen/watch for (usually a string)
 * @param (Function) fn  The function to call when the event is published/fired
 * @param {Object=} obj  The object that the function is a part of (the "this" ptr for the function)
 * @param {Number=} priorty  Way of ordering who gets informed of the event first or last (defaults to 100)
 * @return {*}  Handle to your subscribed-to event
 */
UT.EventBus.prototype.subscribe = function(event, fn, obj, priority) {
	var returnHandle;
	var evt;
	var evtData;
	if (!priority || typeof priority != Number) priority = 100;
	if (priority < 0) priority = 0;

	// create handle data
	returnHandle = this._nextHandle;
	this._nextHandle++;
	evtData = { priority:priority, event:event };
	this._handles[returnHandle] = evtData;

	// 1) find or create event
	evt = this._events[event];
	if (!evt) {
		this._events[event] = {};
		evt = this._events[event];
		evt.subscribers = {};			// collection of functions to call-on-publish
		evt.subscribers.pri = [];		// priority-ordered functions
	}
	
	
	// 2) add to subscriber list
	if (!evt.subscribers.pri[priority]) {
		evt.subscribers.pri[priority] = [];
	}
	evt.subscribers.pri[priority].push( { fn:fn, obj:obj } );
	evtData.evt = evt;

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
UT.EventBus.prototype.allowVeto = function(handle, fn, obj) {
	// 1) find event
	// 2) add to veto list
};

/**
 * unsubscribe.  quit listening for an event
 * @param {*} handle  The event-handle to a previously subscribed-to event
 */
UT.EventBus.prototype.unsubscribe = function(handle) {
	// 1) find event
	// 2) remove "handle" from subscribers + vetoers
};

/**
 * check if an event will be processed (if the event is "valid" to run right now)
 * Usually this is used in UI to gray-out actions that are not valid
 * @param {string} event  The event to listen/watch for (usually a string)
 * @return {boolean}  true means the event IS VALID
 */
UT.EventBus.prototype.checkEvent = function(event) {
	// 1) find event
	// 2) check veto
};

/**
 * publish an event
 * @param {*} event  The event to listen/watch for (usually a string)
 * @param {*} args  argument with the event (usually a JSON object)
 * @return {number}  The number of subscribers that got the event (0 means no one, -1 means it was veto'ed)
 */
UT.EventBus.prototype.publish = function(event, args) {
	// 1) find event
	// 2) check veto
	// 3) call all subscribers
};

/**
 * find information, given an event handle
 * @private
 * @param {*} handle  The event-handle to a previously subscribed-to event
 * @return {Object}  {  evt:eventData, 
 */
UT.EventBus.prototype._findEventViaHandle = function(handle) {
};





// // // // // // // // // // // // //
// 
//		EventBus 
//

// EventBus.Event constructor
UT.EventBus.Event.prototype.init = function() {
	// the id of the event (the name of the event.  e.g. "cmd_undo")
	/** @type (string) */
	this.id;
	
	// true means this event has been handled by someone.  others may continue to handle, if they wish
	/** @type (boolean) */
	this.handled;
	
	// JSON data arguments for the event
	this.args;
};

UT.EventBus.prototype.init = function() {
	// private Pub/Sub handler
	this._pubsub;
};
/**
 * Subscribe to an event
 * @param {string} eventID  The eventID to listen/watch for
 * @param (Function) fn  The function to call when the event is published/fired
 * @param {Object=} obj  The object that the function is a part of (the "this" ptr for the function)
 * @param {Number=} priorty  Way of ordering who gets informed of the event first or last (defaults to 100)
 * @return {*}  Handle to your subscribed-to event
 */
UT.EventBus.prototype.subscribe = function(event, fn, obj, priority) {
};

// NOTES: Question:  Is PubSub an EventBus in itself ???

