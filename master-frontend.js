//cursor position fetching code inspired by Diego Perini
//javascript.nwbox.com/cursor_position/
var glob = {
    "errorArray": [],
    "currentError":null,
    //modifies currentError
    "createErrorStub": function createErrorStub(errorType) {
	var submission = document.getElementById("originaltext");
	var text = submission.value;
	var selStart = submission.selectionStart;
	var selEnd = submission.selectionEnd;
	window.alert([errorType,String(selStart), String(selEnd),
		      text.substring(selStart,selEnd)].join(' '));
	this.currentError = {'type':errorType,'start':selStart,
			     'end':selEnd, 'string':text.substring(selStart,selEnd),
			     'action':""};
    },
    //modifies errorArray
    "addActionToErrorStub": function(action) {
	if (this.currentError === null) {
	    window.alert("No error is marked, or marked error is already added to the error list");
	    return;
	}
	this.currentError.action = action;
	window.alert("action: " + action + " added to error\n" + this.currentError.toString());
	this.errorArray.push(this.currentError);
	this.updateErrorList(this.errorArray);
	this.currentError = null;
    },

    //Update the errorlist by constructing a new tbody from the errorArray.
    //TODO, I need to sort the errorArray based on index.
    //I also need to check for overlapping errors, which I can't handle yet
    "updateErrorList":function updateErrorList(errorArray){
	var table = document.getElementById("errortable"),
	newbody = document.createElement('tbody'),
	oldbody = table.lastChild,
	i,e;
	for (i = 0; i < this.errorArray.length; i += 1) {
	    e = errorArray[i];
	    newbody.appendChild(this.createTblRow([String(i + 1),
						   e['string'],e['type'],e['action']]));
	}
	table.replaceChild(newbody,oldbody);
    },
    //take an array of data and return a row with one cell for each item
    "createTblRow": function createTblRow(data) {
	var newrow = document.createElement('tr'),j;
	for (j = 0; j < data.length; j += 1) {
	    newrow.insertCell(-1).appendChild(
		document.createTextNode(data[j]));
	}
	return newrow;
    },    
    //It's getting obvious that I need to define a proper error object.
    "sortErrorArray": function sortErrorArray(errorArray){
	
    }
    
};