// UT.EventBus
// Can create multiple EventBus objects
// Can use the static default EventBus object (UT.EventBus.getInstance())
//		*) eventID (string)			// the name of the event ("cmd.file.open")
//		*) subscribe(...)			// listen/wait for the event to happen
//		*) publish(now)				// fire/cause the event to happen sometime in the future (or immediately)
//		*) addVetoCheck(...)		// listen/wait for the event to happen, and possibly cancel/veto it
//
//		*) When an eventID is published, an eventObject is created and processed
//		*) an eventObject can be marked as "processed"
//
// Note about eventID:
//	eventIDs are strings that are period-separated words (e.g. "cmd.file.open")
//	each period marks a new event that is published (e.g. "cmd" then "cmd.file" then "cmd.file.open")
//	when the event is published, ALL events are checked for veto.  Any veto causes the entire event to be vetoed
//	when the event is published, ALL events are published (allowing a general-purpose "cmd" listener)
//	Note: this canbe very usefull for macro-recording
//




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
	// create a local PubSub
	this._pubsub = UT.PubSub.create();
	
};

/**
 * Subscribe to an event
 * NOTE: You must specify exactly the eventID you are interested in
 *			"cmd.file.open"		will ONLY get that exact command-event
 *			"cmd.file"			will get ALL "file command"-events
 *			"cmd"				will get ALL "command"-events
 * @param {string} eventID  The eventID to listen/watch for
 * @param (Function) fn  The function to call when the event is published/fired
 * @param {Object=} obj  The object that the function is a part of (the "this" ptr for the function)
 * @param {Number=} priorty  Way of ordering who gets informed of the event first or last (2 to 8) default=5
 * @return {*}  Handle to your subscribed-to event
 */
UT.EventBus.prototype.subscribe = function(eventID, fn, obj, priority) {
	if (typeof priority === 'number') {
		if (priority > 8) priority = 8;			// reserve priority-9 for EventBus use
		if (priority < 2) priority = 2;			// reserve priority-0,1 for EventBus use
	}
	return this._pubsub.subscribe(eventID, fn, obj, priority);
};

/**
 * Subscribe to an event, knowing response time is slow (e.g. over a socket connection)
 * @param {string} eventID  The eventID to listen/watch for (and pass along over the socket)
 */
UT.EventBus.prototype.subscribeSlow = function(eventID) {
	return this._pubsub.subscribeSlow(eventID);
};


/**
 * Subscribe to an event, knowing response time is slow (e.g. over a socket connection)
 * @param {string} eventID  The eventID to listen/watch for (and pass along over the socket)
 * @param {string|Array.<string>} cls  The class (or classes) to attach to the eventID
 */
UT.EventBus.prototype.attachClassToEvent = function(eventID, cls) {
	this._pubsub.attachClassToEvent(eventID, cls);
};

/**
 * Setup to allow veto-power over a published event (allows for cancelling of events)
 * NOTE: You must specify exactly the eventID you are interested in
 *			"cmd.file.open"		will ONLY check that exact command-event
 *			"cmd.file"			will check ALL "file command"-events
 *			"cmd"				will check ALL "command"-events
 * @param {string} eventID  The id(name) of the event to listen/watch for
 * @param {Function} fn  The function to call to check if the event should be veto'ed
 * @param {Object=} obj  The object that the function is a part of (the "this" ptr for the function)
 * example:  var doVeto = fn("eventA", justChecking);
 *		justChecking = a boolean.  true means someone called checkEvent, not publish.
 */
UT.EventBus.prototype.addVetoCheck = function(eventID, fn, obj) {
	return this._pubsub.addVetoCheck(eventID, fn, obj);
};

UT.EventBus.prototype.removeVetoCheck = function(handle) {
	return this._pubsub.removeVetoCheck(handle);
};

/**
 * unsubscribe.  quit listening for an eventID
 * @param {*} handle  The event-handle to a previously subscribed-to event
 */
UT.EventBus.prototype.unsubscribe = function(handle) {
	return this._pubsub.unsubscribe(handle);
};

/**
 * check if an event will be processed (if the event has any subscribers)
 * NOTE: You specify the eventID you are interested in, and MULTIPLE events will be checked:
 *			"cmd.file.open"		will check "cmd" and "cmd.file" and "cmd.file.open"
 *			"cmd.file"			will check "cmd" and "cmd.file"
 *			"cmd"				will only check "cmd"
 * @param {string} eventID  The id(name) of the event to check
 * @return {boolean}  true means the event IS VALID (someone is subscribed, and won't be veto'ed)
 */
UT.EventBus.prototype.checkEvent = function(eventID, args) {
	var events = this._processEventID(eventID);		// break up event into collection of events
	return this._checkEvent(events, args).code;		// return if this event is veto'ed or no-one-listening or someone-listening
};

/**
 * check if an event will be processed (if the event has any subscribers)
 * @param {Array.<string>} events  array of eventIDs to check
 * @return {Object}  event checked info object: { code: null, classes: {} }
 */
UT.EventBus.prototype._checkEvent = function(events, args) {
	var returnObj = {
		code: null,									// default: no one listening to any events/classes
		classes: null								// a single collection of all classes on all events
	};
	var returnCode = null;							// return defaults to "no one listening"
	var idx;										// index into array of eventID's to check
	var chk;										// check-code from one event
	var classes = {};								// collection of all class names of all events
	var cls;										// classes from one event
	var key;										// sigle class from single event
	// check if any event is veto'ed
	for(idx=0; idx<events.length; idx++) {
		chk = this._pubsub.checkEvent(events[idx], args);
		if (chk === false) {
			// VETOED
			return false;
		} else if (chk === true) {
			// at least 1 subscriber is listening to part of the event (so far, unless get veto'ed)
			returnCode = true;
		}
		// gather all classes from this event into the common collection (classes)
		cls = this._pubsub.getEventClasses(events[idx]);
		if (cls) {
			for(key in cls) {
				if (cls.hasOwnProperty(key)) {
					classes[key] = key;
				}
			}
		}
	}
	// check if any class of any event if veto'ed (or being listened to)
	for(key in classes) {
		if (classes.hasOwnProperty(key)) {
			// check this one class-name for veto
			chk = this._pubsub.checkEvent(":"+key, args);
			if (chk === false) {
				// VETOED
				return false;
			} else if (chk === true) {
				// at least 1 subscriber is listening to part of the event (so far, unless get veto'ed)
				returnCode = true;
			}
		}
	}

	// return either "null=no subscribers"  or  "true=at least 1 subscriber" (known no veto'ers)
	return returnCode;
};

/**
 * publish/trigger/fire an event
 * @param {string} eventID  The id(name) of the event to publish/fire/cause
 * @param {*} args  argument with the event (usually a JSON object)
 * @return {number}  The number of subscribers that got the event (0 means no one, -1 means it was veto'ed)
 */
UT.EventBus.prototype.publish = function(eventID, args) {
	var n = 0;							// return the number of subscribers event was published to
	if (!args) args = {};
	// has NOT been processed yet
	args.beenProcessed = false;
	// the original eventID ("cmd.file.open")
	args.eventID = eventID;
	
	var events = this._processEventID(eventID);
	var evtCheck = this._checkEvent(events, args);		// { code: true, classes: {} }
	if (evtCheck.code) {
		var idx;
		var nSlow = 0;
		// publish all events locally, once
		for(idx=0; idx<events.length; idx++) {
			n += this._pubsub.publishNow(events[idx], args, true);
			nSlow += this._pubsub.checkPublishSlow(events[idx], args);
		}
		// publish all classes locally, once
		if (evtCheck.classes) {
			for(var key in evtCheck.classes)  {
				if (evtCheck.classes.hasOwnProperty(key)) {
					n += this._pubsub.publishNow(":"+key, args, true);
					nSlow += this._pubsub.checkPublishSlow(":"+key, args);
				}
			}
		}
		// if any event or any class was marked as "send to slow" then:
		if (nSlow > 0) {
			// publish original eventID ONCE to the "slowConnection"
			// Note: the args argument has already been processed locally (args.beenProcessed MAY be set to true)
			this._pubsub.publishNow(eventID, args);
		}
	}
	return n;
};

/**
 * queue up an event to be published later (nothing returned)
 * @param {string} eventID  The id(name) of the event to publish/fire/cause
 * @param {*} args  argument with the event (usually a JSON object)
 */
UT.EventBus.prototype.queueEvent = function(eventID, args) {
	// @TODO: WORK HERE ... ad queue and a way to process queue
};


/**
 * process a single eventID into multiple event IDs (an array of eventID)
 * @param {string|Array.<string>} eventID  The id(name) of the event to publish/fire/cause
 * @return {Array.<string>}  An array of event IDs
 */
UT.EventBus.prototype._processEventID = function(eventID) {
	if (typeof(eventID === 'string')) {				// "cmd.file.open"
		var arr = eventID.split(".");				// ["cmd", "file", "open"]
		var str = arr[0];
		for(var idx=1; idx<arr.length; idx++) {
			str += "." + arr[idx];
			arr[idx] = str;
		}
		return arr;									// ["cmd", "cmd.file", "cmd.file.open"]
	}
	return eventID;
};



