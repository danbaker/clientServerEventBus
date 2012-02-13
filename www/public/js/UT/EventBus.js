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
		if (priority > 8) priority = 8;
		if (priority < 2) priority = 2;
	}
	return this._pubsub.subscribe(eventID, fn, obj, priority);
};

/**
 * Subscribe to an event, knowing response time is slow (e.g. over a socket connection)
 * @param {string} eventID  The eventID to listen/watch for (and pass along over the socket)
 * @param (Function) fn  The function to call when the event is published/fired
 * @param {Object=} obj  The object that the function is a part of (the "this" ptr for the function)
 * @return {*}  Handle to your subscribed-to event
 */
UT.EventBus.prototype.subscribeSlow = function(eventID, fn, obj, priority) {
	var returnHandle = this._pubsub.getNextHandle();
	var evtData = { eventID:eventID };
// @TODO: ??? WORK HERE ... DO IN PubSub FIRST ???
	this._slowHandles[returnHandle] = evtData;
	this._slowSubscribers[hand] = {};
	
	return returnHandle;
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
UT.EventBus.prototype.checkEvent = function(eventID) {
	var events = this._processEventID(eventID);
	var idx;
	var returnCode = null;			// defaults to "no one listening"
	var chk;
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
	if (!args) args = {};
	// has NOT been processed yet
	args.beenProcessed = false;
	// the original eventID ("cmd.file.open")
	args.eventID = eventID;
	var events = this._processEventID(eventID);
	var idx;
	var n = 0;
	// check if any event is veto'ed
	for(idx=0; idx<events.length; idx++) {
		if (this._pubsub.checkEvent(events[idx], args) === false) {
			// VETOED
			return -1;
		}
	}
	// publish all events
	for(idx=0; idx<events.length; idx++) {
		n += this._pubsub.publishNow(events[idx], args);
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
 * @param {string|Array<string>} eventID  The id(name) of the event to publish/fire/cause
 * @return {Array<string>}  An array of event IDs
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



