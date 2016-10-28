var Debug = {
	// PRIVATE MEMBERS
	'_debugger': [],
	'_debuggerRoot': null,
	'_displayed': false,

	// CONSOLE-LIKE MEMBERS
	'_counts': {},
	'_times': {},

	// Configuration variable
	'configuration': {
		'enabled' : true, // Toggle the complete status of Debug
		'uncollapseDefault': false, // if true, collapsed groups will be expanded by default
		'maxDOMPathDepth' : 5 // Max "depth" dom path to show parents
	},

	// PRIVATE METHODS
	'_init': function(){
		Debug._debuggerRoot = document.createElement("div");
		Debug._debuggerRoot.setAttribute('id','debugger-container');
	
		var _style = document.createElement('style');
		_style.innerHTML = [
			'#debugger-container {',
			'	display: none; ',
			'	background: rgba(255,255,255,.9);',
			'	color: black; font-family: monospace; ',
			'	font-size: 12px; ',
			'	position: fixed; ',
			'	top: 20px; ',
			'	right: 20px; ',
			'	width: 70%; ',
			'	bottom: 20px; ',
			'	border: 1px solid black; ',
			'	padding: 12px 0; ',
			'	box-sizing: ',
			'	border-box;z-index:999999;',
			'	overflow-y: scroll;',
			'	overflow-x: hidden;',
			'}',
			'#debugger-container .group{',
			'	margin-left: 24px;',
			'	border-left: 2px solid gray;',
			'}',
			'#debugger-container .group.collapsed{',
			'	overflow: hidden;',
			'	height: 1.2em;',
			'	background: lightgray;',
			'}',
			'#debugger-container .group.collapsed:before{',
			'	content: "collapsed";',
			'	font-style: italic;',
			'	padding: 12px;',
			'}',
			'#debugger-container p{ margin: 0; padding: 0 12px; }',
			'#debugger-container p.log{ }',
			'#debugger-container p.error{ background: #FFA5A5; }',
			'#debugger-container p.warn{ background: #FFF3A5; }',

			'#debugger-container .timestamp{ color: #808080; }',
			'#debugger-container .variable_number{ color: #800080; }',
			'#debugger-container .variable_string{ color: #000000; }',
			'#debugger-container .variable_object{ color: #8B0000; }',
			'#debugger-container .variable_array{ color: #008B00; }',
			'#debugger-container .variable_undefined{ color: #FF0000; font-weight: bold;}',
			'#debugger-container .variable_boolean{ color: #0000FF; font-weight: bold;}',
			'#debugger-container .variable_function{ color: #008080; }',
			'#debugger-container .variable_dom{ color: #666; font-style: italic; }'
		].join(' \r\n');
		
		document.body.appendChild(Debug._debuggerRoot, null);
		Debug._debuggerRoot.appendChild(_style,null);

		Debug._debugger.push(Debug._debuggerRoot);
	},
	'_addLine': function(type, args){
		if(Debug._debugger.length === 0) Debug._init();

		var newLine = document.createElement('p');
		newLine.setAttribute('class',type);

		newLine.innerHTML = '<span class="timestamp">[' + (new Date()).toJSON() + ']</span> '; 
		for(var i = 0, l = args.length; i < l; i++){
			
			newLine.innerHTML += Debug._getString(args[i]) + " ";
		}

		Debug._debugger[Debug._debugger.length-1].appendChild(newLine, null);
		Debug._debuggerRoot.scrollTop = 999999999999;
	},
	'_getString': function(arg){
		var _str = '';
		var _cls = (typeof arg);
		switch(typeof arg){
			case 'string':
			case 'number':
				_str = arg.toString().replace(/</g,"&lt;").replace(/>/g,"&gt;"); 
				break;
			case 'boolean':
				_str = (arg === true ? 'true': 'false');
				break;
			case 'function':
				_str = (arg.name)  + "()";
				break;
			case 'object':
				if(Debug._isDOM(arg)){
					_str = Debug._getDOMPath(arg);
					_cls = 'dom';
				}
				else if(Debug._isJQuery(arg)){
					_str = Debug._getDOMPath(arg[0]);
					_cls = 'dom';
				}
				else {
					_str = JSON.stringify(arg);
					_cls = Array.isArray(arg) ? 'array' : 'object';
				}
				break;
			case 'undefined':
				_str = 'undefined';
				_cls = 'undefined';
				break;
		}

		return '<span class="variable_' + _cls + '">' + _str + '</span>'; 
	},

	// Private "Utility" methods to detect specific type of variables
	'_isJQuery': function(elm){
		return ("jQuery" in window) && (elm instanceof jQuery);
	},
	'_isDOM': function(elm){
		if ("HTMLElement" in window) {
			return (elm && elm instanceof HTMLElement);
		}
		return !!(elm && typeof elm === "object" && elm.nodeType === 1 && elm.nodeName); // if HTMLElement is not supported
	},
	// Returns a string of the DOM path of the element up to <html>
	'_getDOMPath': function(elm){
		var _parents = [],
			_strings = [],
			_depth   =  0;

		while (elm.parentElement && _depth < Debug.configuration.maxDOMPathDepth){
    		_parents.push(elm = elm.parentElement);
			_depth += 1;
		}
		_parents.reverse();

		for(var i = 0, l = _parents.length; i < l; i++){
			_strings.push(_parents[i].tagName.toLowerCase() + (_parents[i].hasAttribute('id') ? '#' + _parents[i].getAttribute('id') : '') + (_parents[i].hasAttribute('class') ? '.' + _parents[i].getAttribute('class').trim().replace(' ','.') : ''));
		}

		return _strings.join('>');
	},
	// Returns a stack trace to output if needed
	'_getStackTrace': function(){
		var e = new Error('dummy');
		var stack = e.stack.replace(/^[^\(]+?[\n$]/gm, '')
			.replace(/^\s+at\s+/gm, '')
			.replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
			.split('\n');
			
		return stack;
	},


	// PUBLIC METHODS : display : show / hide / toggle, pagination : previous / next, grouping : collapse / expand 
	'show': function(){
		if(!Debug.configuration.enabled) return;

		Debug._debuggerRoot.style.display = "block";
		Debug._displayed = true;
	},
	'hide': function(){
		if(!Debug.configuration.enabled) return;

		Debug._debuggerRoot.style.display = "none";
		Debug._displayed = false;
	},
	'toggle': function(){
		if(!Debug.configuration.enabled) return;

		if(!Debug._displayed){
			Debug.show();
		}
		else{
			Debug.hide();
		}
	},
	'previous': function(){
		if(!Debug.configuration.enabled) return;

		Debug._debuggerRoot.scrollTop -= parseInt(Debug._debuggerRoot.clientHeight/2);
	},
	'next': function(){
		if(!Debug.configuration.enabled) return;

		Debug._debuggerRoot.scrollTop += parseInt(Debug._debuggerRoot.clientHeight/2);
	},
	'expand': function(){
		if(!Debug.configuration.enabled) return;

		_elms = document.querySelectorAll('#debugger-container .collapsed');
		for(var i = 0, l = _elms.length; i < l; i++){
			_elms[i].className = _elms[i].className.replace('collapsed', 'uncollapsed'); 
		}
	},
	'collapse': function(){
		if(!Debug.configuration.enabled) return;

		_elms = document.querySelectorAll('#debugger-container .uncollapsed');
		for(var i = 0, l = _elms.length; i < l; i++){
			_elms[i].className = _elms[i].className.replace('uncollapsed', 'collapsed'); 
		}
	},

	// CONSOLE-LIKE API
	
	// Classic methods
	'log': function(){
		if(!Debug.configuration.enabled) return;

		if(window.console) console.log.apply(console, arguments);
		Debug._addLine('log',arguments);
	},
	'warn': function(){
		if(!Debug.configuration.enabled) return;

		if(window.console) console.warn.apply(console, arguments);
		Debug._addLine('warn',arguments);
	},
	'error': function(){
		if(!Debug.configuration.enabled) return;

		if(window.console) console.error.apply(console, arguments);
		Debug._addLine('error',arguments);
	},
	'info': function(){
		if(!Debug.configuration.enabled) return;

		if(window.console) console.info.apply(console, arguments);
		Debug._addLine('info',arguments);
	},

	// Advanced methods
	'group': function(){
		if(!Debug.configuration.enabled) return;

		if(window.console) console.group.apply(console, arguments);

		var _newGroup = document.createElement('div');
		_newGroup.setAttribute('class','group');
		Debug._debugger[Debug._debugger.length-1].appendChild(_newGroup,null);
		Debug._debugger.push(_newGroup);
	},
	'groupCollapsed': function(){
		if(!Debug.configuration.enabled) return;
		
		console.groupCollapsed.apply(console, arguments);

		var _newGroup = document.createElement('div');
		_newGroup.setAttribute('class','group' + (Debug.configuration.uncollapse ? '' : ' collapsed'));
		Debug._debugger[Debug._debugger.length-1].appendChild(_newGroup,null);
		Debug._debugger.push(_newGroup);
	},
	'groupEnd': function(){
		if(!Debug.configuration.enabled) return;

		console.groupEnd.apply(console, arguments);

		Debug._debugger.pop();
	},
	'trace': function(){
		if(!Debug.configuration.enabled) return;

		console.trace.apply(console, arguments);

		Debug._addLine('stack',[Debug._getStackTrace()]);
	},

	'time': function(){
		if(!Debug.configuration.enabled) return;

		console.time.apply(console, arguments);

		Debug._times[arguments[0]] = Date.now();
	},
	'timeEnd': function(){
		if(!Debug.configuration.enabled) return;

		console.timeEnd.apply(console, arguments);

		Debug._addLine('time',[arguments[0] + ' : ', (Date.now() - Debug._times[arguments[0]]), 'ms']);
	},

	'count': function(){
		if(!Debug.configuration.enabled) return;

		console.count.apply(console, arguments);

		var _label = arguments[0] !== undefined ? arguments[0] : '###'+Debug._getStackTrace().join('').replace(/:\d+:\d+/g,'');

		if(Debug._counts[_label] === undefined)
			Debug._counts[_label] = 0;

		Debug._counts[_label]++;

		Debug._addLine('count',[(arguments[0] !== undefined ? _label : '<no label>') + ' : ' , Debug._counts[_label]]);
	}, 

	'clear': function(){
		if(!Debug.configuration.enabled) return;

		console.clear();

		var _elms = document.querySelectorAll('#debugger-container p, #debugger-container div');

		for(var i = 0, l = _elms.length; i < l; i++){
			_elms[i].remove();
		}
	}
};