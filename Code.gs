function onOpen() {
  var ui = DocumentApp.getUi();
  var menu = ui.createMenu('SPLAT');
  menu.addItem('Mark work', 'markwork_');  
  menu.addItem('Review work', 'response_');
  menu.addItem('View all feedback', 'feedback_');
  menu.addItem('About','about_');
  menu.addToUi();  
}


function markwork_() {
  var ui = HtmlService.createHtmlOutputFromFile('mark')
  .setTitle('Marking Section');
  DocumentApp.getUi().showSidebar(ui);
}


function response_() {
  var ui = HtmlService.createHtmlOutputFromFile('review')
  .setTitle('Review and Submit');
  DocumentApp.getUi().showSidebar(ui);
}

function feedback_(){
   var htmlOutput = HtmlService
     .createHtmlOutputFromFile('summary')
     .setWidth(800)
     .setHeight(600);
 DocumentApp.getUi().showModalDialog(htmlOutput, 'SPLAT - View All Feedback');
}

function about_(){
  var htmlOutput = HtmlService
     .createHtmlOutputFromFile('about')
     .setWidth(250)
     .setHeight(300);
 DocumentApp.getUi().showModalDialog(htmlOutput, 'About SPLAT');
}


/// GLOBALS ////

//var student;
//var fileId;
//var studentname = null;
//var studentemail = null;


/// CONSTANTS ///

var teachers = ['m.colliver@warwickschool.org','j.peel@warwickschool.org'];

var WORKTITLECOLUMN = 1; // B
var WORKMARKCOLUMN = 2; // C 
var TEACHERCOMMENTCOLUMN = 5; // E
var STUDENTTARGETCOLUMN = 6; // F
var TARGETSTATUSCOLUMN = 7; // G
var TARGETMETCOLUMN = 8; // H

function getStudent(){
  // find student based on doc
  var currentdoc = DocumentApp.getActiveDocument()
  var currentid = DriveApp.getFileById(currentdoc.getId());
  var getowner = currentid.getOwner();
  var viewer = currentid.getViewers();
  for (var i = 0; i < viewer.length; i++) {
    var studentname = viewer[i].getName();
    var studentemail = viewer[i].getEmail();
   }  
  return [studentname,studentemail];
}


function findTracker(){
  // check if a teacher
  if (teachers.indexOf(Session.getActiveUser().getEmail())==-1){
   return false; 
  }
    
  var student = getStudent();
  var searchterm = 'title = "Classroom" and "' + student[1] + '" in owners';
  var classroomf = DriveApp.searchFolders(searchterm).next();

  Logger.log("This is the folder found %s  ", classroomf);
  var searchterm = 'StudentTracker - ' + student[0];          //filename of tracker sheet to be of this format
  var studentfile = classroomf.getFilesByName(searchterm);
  if(studentfile.hasNext()) {
    var filenext = studentfile.next()
    var stdntfile = filenext.getName();
    Logger.log("File was found %s", stdntfile);
    var hwk = DocumentApp.getActiveDocument().getName().split(" ", 1).toString();
    return [true, student[0], stdntfile, filenext,hwk];
  } else {
    Logger.log("File was not found");
    createTracker();
    return false;
  }
}


function createTracker(){
  
  var student = getStudent(studentname, studentemail);
  
  Logger.log('Creating sheet for %s, %s', student[0], student[1]);

  // Create file
  var name = 'StudentTracker - ' + student[0];
  Logger.log('File name will be %s', name);
  var searchterm = 'title = "Classroom" and "' + student[1] + '" in owners';
  var classroomf = DriveApp.searchFolders(searchterm);
    
  var folder = classroomf.next();
  var folderId = folder.getId();
  
  var resource = {
    title: name,
    mimeType:  MimeType.GOOGLE_SHEETS,
    parents: [{ id: folderId}]
  }
  
  var fileJSON = Drive.Files.insert(resource);
  var fileId = fileJSON.id;
  
  var opensheet = SpreadsheetApp.openById(fileId);
  Logger.log(opensheet.getName());
  var activesheet = SpreadsheetApp.setActiveSpreadsheet(opensheet);
  
  var tracker = SpreadsheetApp.setActiveSheet(opensheet.getSheets()[0]);
  
  Logger.log('Current sheet is %s', tracker.getName());
  
  //Feedback Date	Piece of Work	Mark	Teacher Comment	My Target	RAG
  
  tracker.getRange('A1').setValue('Teacher Marked');
  tracker.getRange('B1').setValue('Piece of Work');
  tracker.getRange('C1').setValue('Mark');
  tracker.getRange('D1').setValue('Mark Range');
  tracker.getRange('E1').setValue('Rel Mark');
  tracker.getRange('F1').setValue('Teacher Comment');
  tracker.getRange('G1').setValue('Student Target');
  tracker.getRange('H1').setValue('Target Status');
  tracker.getRange('I1').setValue('Target Met Against');
  tracker.getRange('J1').setValue('Student Response');
  tracker.getRange('K1').setValue('Student Response Date');
  tracker.getRange('L1').setValue('RAG');
}  

// Teachers Comments To Sheet

/*
function writetosheet(formObject) {
  
  Logger.log('writetosheet function called by button');
  
  var feedbackdate = Utilities.formatDate(new Date(), "GMT", "dd/MM/yyyy");
  Logger.log(feedbackdate);
  var hwknumber = formObject.number;
  Logger.log(hwknumber);
  var grade = formObject.grade;
  var comments = formObject.review;
  var targetset = formObject.target;
  
  Logging.log("\n\n\n" + feedbackdate + "\n " + hwknumber + "\n " + grade + "\n" + comments + "\n" + targetset);
  
    var opensheet = SpreadsheetApp.openById(fileId);
  Logger.log(opensheet.getName());
  var activesheet = SpreadsheetApp.setActiveSpreadsheet(opensheet);
  
  var tracker = SpreadsheetApp.setActiveSheet(opensheet.getSheets()[0]);
  
  Logger.log('Current sheet is %s', tracker.getName());

}
*/
function writetosheet(formData) {
  
  //could do validation here on form/server 
  // formdata[0] - hwk name
  // formdata[1] - mark
  // formdata[2] - out of
  // formdata[3] - rel mark
  // formdata[4] - comment
  // formdata[5] - target
  
  var mark = parseInt(formData[1]);
  var outof = parseInt(formData[2]);
  
  var errorMsg = '';
  if (isNaN(mark)) {errorMsg+='Mark needs to be an integer\n';}
  if (isNaN(outof)) {errorMsg+='Out of needs to be an integer\n';}
  if (errorMsg.length==0 && mark>outof) {errorMsg+='Mark can not be greater than out of\n';}
  if (formData[4].length==0) {errorMsg+='Comment needs to be filled in\n';}
  if (formData[5].length==0) {errorMsg+='Target needs to be filled in\n';}
  
  if (errorMsg.length>0){
  var ui = DocumentApp.getUi();
  ui.alert('Validation Error', 'Please correct the following problems:\n'+errorMsg, ui.ButtonSet.OK);
  return false;
  }
  
  //calculate rel mark
  formData[3] = (mark/outof*10).toFixed(2);  

  var student = findTracker();
  Logger.log('writing to sheet');
  var hwk = DocumentApp.getActiveDocument().getName().split(" ", 1).toString();
  Logger.log(hwk);
  
  var filename = student[3].getName();
  var fileid = student[3].getId();
  Logger.log(filename, fileid);
  
  if(student[0]){
    var sheetid = student[3].getId();
    Logger.log(sheetid);    
    var openfile = SpreadsheetApp.openById(sheetid);
    SpreadsheetApp.setActiveSpreadsheet(openfile);    
    var activesheet = openfile.getActiveSheet(); 
    Logger.log('going to append new row');
  //now need to add a new row
    var feedbackdate = Utilities.formatDate(new Date(), "GMT", "dd/MM/yyyy");
    formData.unshift("'"+feedbackdate.toString());
    formData.push('not met');
    activesheet.appendRow(formData);
    return true;
    }
}

  

function getcomments() {
  var student = findTracker();
 // Logger.log(student);
  var hwk = DocumentApp.getActiveDocument().getName().split(" ", 1).toString();
  Logger.log(hwk);
  
  var filename = student[3].getName();
  var fileid = student[3].getId();
  Logger.log(filename, fileid);
  
  if(student[0]){
    var sheetid = student[3].getId();
    Logger.log(sheetid);    
    var openfile = SpreadsheetApp.openById(sheetid);
    SpreadsheetApp.setActiveSpreadsheet(openfile);    
    var activesheet = openfile.getActiveSheet();   
    var alldata = activesheet.getDataRange();
    var allvalues = alldata.getValues();
    
    var currentTargets = [];
    
    Logger.log('The length of the tracker sheet is %s',allvalues.length);
    
    var hwkFound = false;
    for(var i = 0; i < allvalues.length; i++){
      var row = "";
      if (allvalues[i][TARGETSTATUSCOLUMN] == 'not met' && allvalues[i][WORKTITLECOLUMN] != hwk){
        currentTargets.push([i,allvalues[i][STUDENTTARGETCOLUMN]]);}
      Logger.log("the student target is %s and status is %s", allvalues[i][STUDENTTARGETCOLUMN],allvalues[i][TARGETSTATUSCOLUMN]);
        if(allvalues[i][WORKTITLECOLUMN] == hwk){
          var teachercomment = allvalues[i][TEACHERCOMMENTCOLUMN];
          var targetset = allvalues[i][STUDENTTARGETCOLUMN];
          var markgiven = allvalues[i][WORKMARKCOLUMN];
          Logger.log("the teachers comment is %s", teachercomment);
          Logger.log("the row number %s",i+1);   
          hwkFound = true;
          return [student[1], teachercomment, targetset, markgiven,currentTargets,hwk];
        }    
    }

    return false;
  }
}
// Student Response To Sheet

function updateTarget(x){
//open SS and remove target x
    var student = findTracker();
 // Logger.log(student);
  var hwk = DocumentApp.getActiveDocument().getName().split(" ", 1).toString();
  Logger.log('Updating target %s',x);
  
  var filename = student[3].getName();
  var fileid = student[3].getId();
  
  if(student[0]){
    var sheetid = student[3].getId();
    Logger.log(sheetid);    
    var openfile = SpreadsheetApp.openById(sheetid);
    SpreadsheetApp.setActiveSpreadsheet(openfile);    
    var activesheet = openfile.getActiveSheet();   
    var alldata = activesheet.getDataRange();
    var allvalues = alldata.getValues();
    
    activesheet.getRange(parseInt(x)+1,TARGETMETCOLUMN+1).setValue(hwk);
    activesheet.getRange(parseInt(x)+1,TARGETMETCOLUMN).setValue('student met');
    
    return x;
  }
  return 'failed';
  
  
}


function addStudentComment(formData){
 Logger.log('Updating comment');
 
  //open SS and remove target x
    var student = findTracker();
 // Logger.log(student);
  var hwk = DocumentApp.getActiveDocument().getName().split(" ", 1).toString();
  
  var filename = student[3].getName();
  var fileid = student[3].getId();
  
  if(student[0]){
    var sheetid = student[3].getId();
    Logger.log(sheetid);    
    var openfile = SpreadsheetApp.openById(sheetid);
    SpreadsheetApp.setActiveSpreadsheet(openfile);    
    var activesheet = openfile.getActiveSheet();   
    var alldata = activesheet.getDataRange();
    var allvalues = alldata.getValues();
   
       for(var i = 0; i < allvalues.length; i++){
        if(allvalues[i][WORKTITLECOLUMN] == hwk){
          activesheet.getRange(i+1,10).setValue(formData[0]);
          
          var today = "'"+ Utilities.formatDate(new Date(), "GMT", "dd/MM/yyyy");
          activesheet.getRange(i+1,11).setValue(today);
          activesheet.getRange(i+1,12).setValue(formData[1]);
          return true; 
        }
       }
          
    
    
    
    
  }
  return false;
}

function getSpreadsheetData(){
  Logger.log('get ssheet data');
  
    var student = findTracker();
 // Logger.log(student);
    
  var filename = student[3].getName();
  var fileid = student[3].getId();
  
  if(student[0]){
    var sheetid = student[3].getId();
    Logger.log(sheetid);    
    var openfile = SpreadsheetApp.openById(sheetid);
    SpreadsheetApp.setActiveSpreadsheet(openfile);    
    var activesheet = openfile.getActiveSheet();   
    var alldata = activesheet.getDataRange();
    var allvalues = alldata.getValues();  
 
  return allvalues;
  }
  return false;
}
