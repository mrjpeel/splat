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
  // var width = window.innerWidth || document.body.clientWidth;
  // width = wdith *0.8;
  width =800; 
  var htmlOutput = HtmlService
     .createHtmlOutputFromFile('summary')
     .setWidth(width)
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

var teachers = ['m.colliver@warwickschool.org', 'j.peel@warwickschool.org'];

var WORKTITLECOLUMN = 1; // B
var WORKMARKCOLUMN = 2; // C 
var TEACHERCOMMENTCOLUMN = 5; // E
var STUDENTTARGETCOLUMN = 6; // F
var TARGETSTATUSCOLUMN = 7; // G
var TARGETMETCOLUMN = 8; // H



// This code fetches the Google and YouTube logos, inlines them in an email
 // and sends the email
 function inlineImage(hwk) {
   var splatLogoUrl = "https://splat-ebd62.firebaseapp.com/SPLAT_LOGO.png";
   var splatLogoBlob = UrlFetchApp
                          .fetch(splatLogoUrl)
                          .getBlob()
                          .setName("splatLogoBlob");
   MailApp.sendEmail({
     to: "m.colliver@warwickschool.org,j.peel@warwickschool.org",
     subject: "SPLAT - your work is ready for reflection",
     htmlBody: "<div style='background-color:orange;border:2px solid black;height:120px;padding:5px;'><img src='cid:splatLogo' style='float:left'><div style='display:inline-block;margin: 10px 0 0 10px;'>Your work has been marked - please come and reflect on the comments for <a href='"+DocumentApp.getActiveDocument().getUrl()
     +"'>"+hwk+"</a><p>Kind regards,<br><strong>The SPLAT team</strong></div></div>",
     inlineImages:
       {
         splatLogo: splatLogoBlob,
       },
     noReply: true
   });
 }







function getStudent(){
  // find student details based on current doc - 
  // if 'turned in' then function run by teacher and is owner of document so student is a viewer
  // return studentname, studentemail

  //if there are no viewers (ie it has not bee submitted yet or it has been returned)
  //we should return the owner of the document?

  
  Logger.log("In getStudent");
  var currentdoc = DocumentApp.getActiveDocument()
  var currentid = DriveApp.getFileById(currentdoc.getId());
  var getowner = currentid.getOwner();
  var viewer = currentid.getViewers();
  Logger.log("In getStudent - viewers %s",viewer.length);
  for (var i = 0; i < viewer.length; i++) {
    var studentname = viewer[i].getName();
    var studentemail = viewer[i].getEmail();
   }
  if (viewer.length>0){  
    return [studentname,studentemail];}
  else{
    return [getowner.getName(),getowner.getEmail()];
  }
  
}


function getCodeForWork(){
  //work to have a code for the tracker: HWKx , CWKx, TSTx
  //if set via classroom it will follow the student name
  return DocumentApp.getActiveDocument().getName().split(" - ")[1].toString();
}


function findTracker(){

  Logger.log("\n______________\nIn findTracker\n______________\n");


  // check if a teacher
  if (teachers.indexOf(Session.getActiveUser().getEmail())==-1){
   return false; 
  }
  
  //as we move to firebase not all checks are so necessary as should create students the first time we add data....
  //but we could check to see if homework has already been marked

  var student = getStudent();

  
  //var hwk = DocumentApp.getActiveDocument().getName().split(" ", 1).toString();
  var hwk = getCodeForWork();
  //quick search to see if already marked
  //get values from Firebase for this piece of work  
  var fbdb = firebaseconnect();
 
  var studentemail = student[1].split("@", 1).toString();
  var email = studentemail.replace(".","_");
  var path = email + "/ComputerScience/" + hwk; 
  Logger.log("the path used to retrieve the data will be\n%s", path);
  var thedata = fbdb.getData(path);
  Logger.log("\n\nFrom Firebase\n%s\nReturned data is \n%s", email, thedata ); 
  
  //check for Firebase data (homework might not be marked yet)
  if (thedata != null) {return [false, student, 'SPLAT data', '',hwk];}
  
  
  
  return [true, student, 'SPLAT data', '',hwk];


/*
  var searchterm = 'title = "Classroom" and "' + student[1] + '" in owners';
  
  Logger.log("In findTracker the search term is \n%s  \n\n",searchterm);
  
  var classroomf = DriveApp.searchFolders(searchterm).next();

  Logger.log("This is the folder found\n %s \n\n  ", classroomf);
  var searchterm = 'StudentTracker - ' + student[0];          //filename of tracker sheet to be of this format
  var studentfile = classroomf.getFilesByName(searchterm);
  if(studentfile.hasNext()) {
    var filenext = studentfile.next()
    var stdntfile = filenext.getName();
    Logger.log("File was found %s \n\n", stdntfile);
    var hwk = DocumentApp.getActiveDocument().getName().split(" ", 1).toString();
    return [true, student, stdntfile, filenext,hwk];
  } else {
    Logger.log("File was not found\n\n");
    createTracker();
    return false;
  }

*/
}

/*
function createTracker(){
  
  var student = getStudent();
  
  Logger.log('\n\nCreating sheet for \n%s, \n%s', student[0], student[1]);

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

*/

function writeToFirebase(formData){
  // do validation
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
  
  //now setup data ready for Firebase
  var fbdb = firebaseconnect();
  
  var student = getStudent();
  var studentemail = student[1].split("@", 1).toString();
  var email = studentemail.replace(".","_");
  var path = email + "/ComputerScience/" + formData[0] +"/";  // path can be email for all user or email + "/subject" for specific
  Logger.log("the path used to push the data will be\n%s", path);
  
  var feedbackdate = Utilities.formatDate(new Date(), "GMT", "dd/MM/yyyy").toString();
  //might still need the ' ?
  
  var data = {"Teacher marked" : feedbackdate, "Piece of work" : formData[0], "Mark":formData[1], "Mark range":formData[2],"Rel mark":formData[3],"Teacher comment":formData[4],"Student target":formData[5],"Target status":"not met"};
  Logger.log(fbdb.setData(path, data));
  
  inlineImage(formData[0]);
  return true;
  
  
  
}


/*

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

*/


function getCommentsFromFirebase() {
  Logger.log("\n Trying to load comments for student \n");
  
  //part of the REVIEW page - function gets comments for a homework and returns data to review.html
 
  //var student = findTracker(); //do we need this now - we just need the students email 
  var student = getStudent();
  //var hwk = DocumentApp.getActiveDocument().getName().split(" ", 1).toString();
   var hwk = getCodeForWork();
  Logger.log(hwk);

  //get values from Firebase for this piece of work  
  var fbdb = firebaseconnect();
  
  if(fbdb){
    Logger.log("found");
  } else {
    Logger.log("fbdb does not exist");
  }
  
  var studentemail = student[1].split("@", 1).toString();
  var email = studentemail.replace(".","_");
  var path = email + "/ComputerScience/" + hwk; 
  Logger.log("the path used to retrieve the data will be\n%s", path);
  var thedata = fbdb.getData(path);
  Logger.log("\n\nFrom Firebase\n%s\nReturned data is \n%s", email, thedata ); 
  
  //check for Firebase data (homework might not be marked yet)
  if (thedata == null) {return false;}
  
  var teachercomment = thedata["Teacher comment"];
  var targetset = thedata["Student target"];
  var markgiven = thedata["Mark"] + " out of " + thedata["Mark range"] ;
  var currentTargets = [];
  Logger.log("teacher comment: %s", teachercomment);
  
  //not getting all previous targets at the moment - need to rethink Firebase query and grab all data
  // lets grab all comments here for now but come up with a better way later :-)
  path = email + "/ComputerScience/";  //now grab all work data 
  Logger.log("the path used to retrieve the data will be\n%s", path);
  thedata = fbdb.getData(path);
  Logger.log("\n\nFrom Firebase\n%s\nReturned data is \n%s", email, thedata ); 

  for(var i in thedata) {
    Logger.log("Target is %s", thedata[i]["Student target"] ); 

    if (thedata[i]["Target status"] == "not met" && thedata[i]["Piece of work"] != hwk) { currentTargets.push([thedata[i]["Piece of work"],thedata[i]["Student target"]]); }
  }
  
  
  
  return [student[0], teachercomment, targetset, markgiven,currentTargets,hwk];

}

/*
function getcomments() {
  var student = findTracker();
 // Logger.log(student);
 // var hwk = DocumentApp.getActiveDocument().getName().split(" ", 1).toString();
   var hwk = getCodeForWork();
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
          var markgiven = allvalues[i][WORKMARKCOLUMN] + " out of " +allvalues[i][3] ;
          Logger.log("the teachers comment is %s", teachercomment);
          Logger.log("the row number %s",i+1);   
          hwkFound = true;
          return [student[1][0], teachercomment, targetset, markgiven,currentTargets,hwk];
        }    
    }

    return false;
  }
}

*/

// Student Response To Sheet

function updateTarget(x){
//updated for Firebase
 // var hwk = DocumentApp.getActiveDocument().getName().split(" ", 1).toString();  
   var hwk = getCodeForWork();
  var student = getStudent();
  //get values from Firebase for this piece of work  
  var fbdb = firebaseconnect();
  
  var studentemail = student[1].split("@", 1).toString();
  var email = studentemail.replace(".","_");
  var path = email + "/ComputerScience/" + x;

  var data = {"Target status" : "met", "Target met against" : hwk};
  Logger.log(fbdb.updateData(path, data));
  return x;
  
    
  
  
/*  
  //open SS and remove target x
    var student = findTracker();
  
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
*/  
  
}


function addStudentCommentToFirebase(formData){
 Logger.log('Updating comment');

var student = getStudent();
//var hwk = DocumentApp.getActiveDocument().getName().split(" ", 1).toString();
   var hwk = getCodeForWork();
  
  //now setup data ready for Firebase
  var fbdb = firebaseconnect();
  
  var student = getStudent();
  var studentemail = student[1].split("@", 1).toString();
  var email = studentemail.replace(".","_");
  var path = email + "/ComputerScience/" + hwk +"/";  // path can be email for all user or email + "/subject" for specific
  Logger.log("the path used to push the data will be\n%s", path);
  
  var feedbackdate = Utilities.formatDate(new Date(), "GMT", "dd/MM/yyyy").toString();
  //might still need the ' ?
  
  var data = {"Student response date" : feedbackdate, "Student response" : formData[0], "RAG":formData[1]};
  Logger.log(fbdb.updateData(path, data));
  return true;
  
  
  
}

/*
function addStudentComment(formData){
 Logger.log('Updating comment');
 
  //open SS and remove target x
    var student = findTracker();
 // Logger.log(student);
//  var hwk = DocumentApp.getActiveDocument().getName().split(" ", 1).toString();
   var hwk = getCodeForWork();
  
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
*/

function getFirebaseData(){
  Logger.log('\n____________\nGet S_sheet Data\n_____________');
  
  var student = getStudent();
  
 //now setup data ready for Firebase
  var fbdb = firebaseconnect();

  var studentemail = student[1].split("@", 1).toString();
  var email = studentemail.replace(".","_");
  var path = email + "/ComputerScience/" ;  // path can be email for all user or email + "/subject" for specific
  Logger.log("the path used to retrieve the data will be\n%s", path);  

  var thedata = fbdb.getData(path);
  Logger.log("\n\nFrom Firebase\n%s\nReturned data is \n%s", email, thedata ); 
  
  //check if any data returned (Firebase might not be setup for this student
  if (thedata == null) {return [student[0], false];}
  
  //need to setup data structure ready for charting
  
  data=[];
  columnheaders = ["Teacher marked","Work","Mark","Mark range","Rel mark","Teacher comment","Student target","Target status","Target met against","Student Reflection","S R D","RAG"];
  data.push(columnheaders);
 //loop to read through data and put into data structure for charting
  //data.push(["12/2/2018","HWK12",10,12,9.8,"boo","boo","met","boo","2/3","2/3","red"]);
  for(var i in thedata) {
    data.push([ thedata[i]["Teacher marked"],thedata[i]["Piece of work"],thedata[i]["Mark"],thedata[i]["Mark range"],parseFloat(thedata[i]["Rel mark"]),
               thedata[i]["Teacher comment"],thedata[i]["Student target"],thedata[i]["Target status"],thedata[i]["Target met against"],thedata[i]["Student response"],thedata[i]["Student response date"],thedata[i]["RAG"]]);
  }
  
  
  Logger.log("Data being sent back %s",data);
  
  //return values to caller
  return [student[0], data];
}


/*
function getSpreadsheetData(){
  Logger.log('\n____________\nGet S_sheet Data\n_____________');
  
  var student = findTracker();
  
  for(var i =0; i < student.length;i++) {
    
      Logger.log("\nIn getSpreadsheet data student %s contains %s,", i, student[i]);
    }
    
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
 
  return [student,allvalues];
  }
  return false;
}
*/


function firebaseconnect(){
  var fburl = "https://splat-ebd62.firebaseio.com/";
  var fbsecret = "dmncbyHH6zJ9NKkGaeh9lNdYFu3Q9IDsfOWFSAJI";
  var fbdb = FirebaseApp.getDatabaseByUrl(fburl, fbsecret);
  
  return fbdb;


}

/*
// TEST OF FIREBASE //
function tofirebase(){
  var fbdb = firebaseconnect();
  var data = getSpreadsheetData();
  var studentdata = data[1];
  var studentemail = data[0][1][1].split("@", 1).toString();
  var email = studentemail.replace(".","_");
  Logger.log("tofirebase email address is %s", studentemail);

  var jsonify = getJsonArrayFromData(studentdata);
  var path = email + "/ComputerScience/";
  Logger.log(path);
  
  fbdb.setData(path, jsonify);
  
}


function getJsonArrayFromData(data)
{

  var obj = {};
  var result = [];
  var headers = data[0];
  var cols = headers.length;
  var row = [];

  for (var i = 1, l = data.length; i < l; i++)
  {
    // get a row to fill the object
    row = data[i];
    // clear object
    obj = {};
    for (var col = 0; col < cols; col++) 
    {
      // fill object with new values
      obj[headers[col]] = row[col];    
    }
    // add object in a final result
    result.push(obj);  
  }

  return result;  

}


function fromfirebase(){
// Get back a report //
  var fbdb = firebaseconnect();
  
  if(fbdb){
    Logger.log("found");
  } else {
    Logger.log("fbdb does not exist");
  }
  
  var student = getStudent();
  var studentemail = student[1].split("@", 1).toString();
  var email = studentemail.replace(".","_");
  var path = email + "/ComputerScience/";  // path can be email for all user or email + "/subject" for specific
  Logger.log("the path used to retrieve the data will be\n%s", path);
  var thedata = fbdb.getData(path);
  Logger.log("\n\nFrom Firebase\n%s\nReturned data is \n%s", email, thedata ); 
  
}

function firebasequery(){
  var fbdb = firebaseconnect();
  var student = getStudent();
  var studentemail = student[1].split("@", 1).toString();
  var email = studentemail.replace(".","_");
  var path = email + "/ComputerScience";
  
  var subjectRef = fbdb.ref(path);
  var key = subjectRef.key;
  
  subjectRef.orderByChild("Piece of Work").equalTo("HWK2").on("child_added", function(snapshot){
  Logger.log(snapshot.key)
  
  });
  
}
*/