//cursor position fetching code inspired by Diego Perini
//javascript.nwbox.com/cursor_position/
var glob = {
"errorArray": [],
"currentError":{},
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
    this.currentError.action = action;
    window.alert("action: " + action + " added to error\n" + this.currentError.toString());
    this.errorArray.push(this.currentError);
    this.updateErrorList();
},

//Make sure that errorlist matches errorArray
//The simplest way is, I guess to build a new table from errorArray and then
//replace the entire table with that.
//in that case, I need to sort the errorArray based in index.
//I also need to check for overlapping errors, which I can't handle yet
"updateErrorList":function updateErrorList(){
    var table = document.getElementById("errortable"),newRow,nr,string,type,action;
    for (error in glob.errorarray) {
	newRow = table.insertRow
    }
},
//It's getting obvious that I need to define a proper error object.
"sortErrorArray": function sortErrorArray(errorArray){
    
    }
    
};