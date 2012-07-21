//cursor position fetching code inspired by Diego Perini
//javascript.nwbox.com/cursor_position/
var Errors = [];
var currentError;

function createError(errorType) {
var error = {};
error.pos = getErrorOffsets();
error.type = errorType
currentError = error 
}

function getErrorOffset() {
start = getSelectionStart(document.studenttext.originaltext)