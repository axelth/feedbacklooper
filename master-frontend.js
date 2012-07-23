//cursor position fetching code inspired by Diego Perini
//javascript.nwbox.com/cursor_position/
//TODO Functionality for entering corrections and comments. 
//TODO decrease dependence on glob.variables.  Pass in more parameters to functions.
//TODO decrease coupling between html and js (pass id-attributes to functions).
var glob = {
    "errorArray": [],
    "currentError":null,
    //Create an error object (not properly defined yet) and assign it to currentError
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
    //modifies errorArray and call updateErrorList on the new array.
    //The modification consists of pushing currentError and then sorting the
    //errorArray with sortErrorArray.
    //TODO check for overlapping errors
    //TODO factor out the updating of the errorArray (push,sort)
    "addActionToErrorStub": function(action) {
	if (this.currentError === null) {
	    window.alert("No error is marked, or marked error is already added to the error list");
	    return;
	}
	this.currentError.action = action;
	window.alert("action: " + action + " added to error\n" + this.currentError.toString());
	this.errorArray.push(this.currentError);
	this.sortErrorArray(this.errorArray);
	this.updateErrorList(this.errorArray);
	this.currentError = null;
    },

    //Update the errorlist by constructing a new tbody from the errorArray.
    "updateErrorList":function updateErrorList(errorArray){
	var table = document.getElementById("errortable"),
	newbody = document.createElement('tbody'),
	oldbody = table.lastChild,
	i,e;
	for (i = 0; i < this.errorArray.length; i += 1) {
	    e = errorArray[i];
	    newbody.appendChild(this.createTblRow([String(i + 1),
						   e['string'],e['type'],e['action']],i));
	}
	table.replaceChild(newbody,oldbody);
    },
    //take an array of data and return a row with one cell for each item
    //plus a delete-button at the end of the row.
    //TODO factor out the button creation code.
    "createTblRow": function createTblRow(data,i) {
	var newrow = document.createElement('tr'),j,delBtn;
	for (j = 0; j < data.length; j += 1) {
	    newrow.insertCell(-1).appendChild(
		document.createTextNode(data[j]));
	}
	delBtn = document.createElement('button');
	delBtn.setAttribute('name',i);
	delBtn.setAttribute('onclick',"glob.delError(this.name,glob.errorArray);");
	delBtn.appendChild(document.createTextNode("delete"));
	newrow.insertCell(-1).appendChild(delBtn);
	return newrow;
    },
    //Remove error at index from errorArray and updates the errorlist.
    "delError": function delError(index,errorArray) {
	errorArray.splice(index,1);
	this.updateErrorList(errorArray);
    },
    //It's getting obvious that I need to define a proper error object.
    "sortErrorArray": function sortErrorArray(errorArray){
	return errorArray.sort(function(a,b){
				   return a["start"] - b["start"];
			       });
    }
    
};