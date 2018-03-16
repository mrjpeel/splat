function onOpen() {
  var ui = DocumentApp.getUi();
  
  ui.createMenu('SPLAT')
  .addItem('Mark homework', 'markwork_')
  .addItem('Review homework', 'response_')
  .addItem('View all feedback', 'feedback_')
  .addToUi();
  
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
  var ui = HtmlService.createHtmlOutputFromFile('summary')
  .setTitle('View All Feedback');
  DocumentApp.getUi().showSidebar(ui);
  
}


/// GLOBALS ////

var student;
var fileId;
var studentname = null;
var studentemail = null;

/// CONSTANTS ///

var WORKTITLECOLUMN = 1; // B
var WORKMARKCOLUMN = 2; // C 
var TEACHERCOMMENTCOLUMN = 4; // E
var STUDENTTARGETCOLUMN = 5; // F
var TARGETSTATUSCOLUMN = 6; // G
var TARGETMETCOLUMN = 7; // H

function getstudent(studentname, studentemail){
 
    // find student based on doc
  var currentdoc = DocumentApp.getActiveDocument()
  var currentid = DriveApp.getFileById(currentdoc.getId());
  var getowner = currentid.getOwner();
  var viewer = currentid.getViewers();
  Logger.log('The id of the current doc is %s and the owner is %s', currentid,getowner.getName());
  Logger.log('There are %s viewers',viewer.length);
  for (var i = 0; i < viewer.length; i++) {
   Logger.log('The student is %s and their email is %s', viewer[i].getName(), viewer[i].getEmail());
    var studentname = viewer[i].getName();
    var studentemail = viewer[i].getEmail();
   }
  
  return [studentname,studentemail];
}


function findtracker(){
  
  var student = getstudent(studentname, studentemail);
  Logger.log('Finding tracker with %s',student[0]);


  var searchterm = 'title = "Classroom" and "' + student[1] + '" in owners';
  Logger.log('Finding tracker with %s',searchterm);

  var classroomf = DriveApp.searchFolders(searchterm).next();
  Logger.log("This is the folder found %s  ", classroomf);
  var searchterm = 'StudentTracker - ' + student[0];
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
  
  var student = getstudent(studentname, studentemail);
  
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
  
  tracker.getRange('A1').setValue('Feedback Date');
 // tracker.getRange('A2').setValue(Utilities.formatDate(new Date(), "GMT", "dd/MM/yyyy"));
  tracker.getRange('B1').setValue('Piece of Work');
  tracker.getRange('C1').setValue('Mark');
  tracker.getRange('D1').setValue('Teacher Comment');
  tracker.getRange('E1').setValue('My Target');
  tracker.getRange('F1').setValue('Student Response');
  tracker.getRange('G1').setValue('Response Date');
  tracker.getRange('H1').setValue('RAG');
    
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
  
    var student = findtracker();
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
    formData.unshift(feedbackdate);
    formData.push('not met');
    activesheet.appendRow(formData);
    }
}

  

function getcomments() {
  var student = findtracker();
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
          return [student[1], teachercomment, targetset, markgiven,currentTargets];
        }    
    }

    return false;
  }
}
// Student Response To Sheet

function updateTarget(x){
//open SS and remove target x
    var student = findtracker();
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
    var student = findtracker();
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
          activesheet.getRange(i+1,9).setValue(formData[0]);
          
          var today = Utilities.formatDate(new Date(), "GMT", "dd/MM/yyyy");
          activesheet.getRange(i+1,10).setValue(today);
          activesheet.getRange(i+1,11).setValue(formData[1]);
          return true; 
        }
       }
          
    
    
    
    
  }
  return false;
  
  
  
  
  
  
  
}

