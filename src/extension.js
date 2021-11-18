"use strict";
/*
    Copyright (C) 2018-2021 William McKeever. All rights reserved.
    Licensed under the MIT License. (See LICENSE.md in the project root for license information)
*/

//--- Not sure what this does (Need to Research ---
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;

//--------------------------------------
//--- Define Constants and Variables ---
const vscode = require("vscode");
const path = require("path");
const cp = require("child_process");
const tbscripthover = require('./hover/tbscript.json')

//--------------------------
//--- Configuration Settings
var settings = vscode.workspace.getConfiguration("tbscript");
var tbos_exe = settings.get("tbosdt.exe");

//------------------
//--- Output Channel
var outputChannel;

//---------------------------------------------------------
//              --- Function Activate ---
//---------------------------------------------------------
function activate(context) {
  //- Log Extension Active Message
  // console.log('Congratulations, your extension "tbscript" is now active!');
  const active = vscode.window.activeTextEditor
  if (!active || !active.document) return

  //-------------------------
  //- Register Hover Provider
  registerDocType('tbscript');

  function registerDocType(type) {
    context.subscriptions.push(vscode.languages.registerHoverProvider(type, {
      provideHover(document, position) {
        const range = document.getWordRangeAtPosition(position);
        const word = document.getText(range);
  
        for (const snippet in tbscripthover) {
          if (tbscripthover[snippet].prefix == word || tbscripthover[snippet].hover == word) {
            return createHover(tbscripthover[snippet], type)
          }
        }
      }
    }));
  }

  //-----------------------
  //- Create Output Channel
  outputChannel = vscode.window.createOutputChannel('TeraByte Script');

  //----------------------------------------------------------
  //- Command ID's
  //- This must match the command property in the package.json
  const commandID1 = "tbscript.run.internal";
  const commandID2 = "tbscript.run.external";

  //---------------
  //- Subscriptions
  context = context;
  context.subscriptions.push(vscode.commands.registerCommand(commandID1, RunScriptInternal));
  context.subscriptions.push(vscode.commands.registerCommand(commandID2, RunScriptExternal));
//  context.subscriptions.push(vscode.languages.registerHoverProvider('tbs', new GoHoverProvider()));
//  context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(fileChanged));
//  context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(activeTextEditor));
};

  //---------------
  //--- Exports ---
  module.exports = {
    activate,
    deactivate,
  };

  //--------------
  //- Create Hover
  function createHover(snippet, type) {
  const usage = typeof snippet.usage == 'undefined' ? '' : snippet.usage;
  const description = typeof snippet.description == 'undefined' ? '' : snippet.description;
  const example = typeof snippet.example == 'undefined' ? '' : snippet.example;

  var retval = "";
  if (usage) retval = retval+'Usage: '+usage;
  if (description) retval = retval+'Description:\n'+description;
  if (example) retval = retval+'\n\n'+'Example:\n'+example;
//  console.log('nnn',retval);
  return new vscode.Hover({
      language: type,
      value: retval
//      value: 'Usage: ' + usage + '\n\n' + 'Description:\n' + description + '\n\n' + 'Example:\n' + example
  });
};

//---------------------------------------
//--- Run Script in Internal TBCMD ------
//       (Default Hot Key F6)
//---------------------------------------
function RunScriptInternal() {

  //console.log('Internal TBCMD Command');

  //----------------------------------
  //--- Document Name and Path Strings
  var ActiveDocument = vscode.window.activeTextEditor.document.fileName;
  var ActiveDocumentPath = path.dirname(ActiveDocument);
  var ActiveDocumentName = path.basename(ActiveDocument);
  //  var ActiveDocumentExt = path.extname(ActiveDocument);

  //-------------------------------------------------
  //--- If Document is Dirty Then Save the File First
  let DirtyFlag = vscode.window.activeTextEditor.document.isDirty;
  if (DirtyFlag) {
    //console.log("Document is Dirty Saving Now");
    let SaveCommand = vscode.window.activeTextEditor.document.save;
    SaveCommand();
  };

  //------------------------------------
  //--- Run The Script in Internal TBCMD
  var StartProcess = "run "+ActiveDocumentName;
  var tbterm;// = vscode.window.activeTerminal;

  //--------------------------------------------------------------
  //- If Terminal Not Opened Then Create New TeraByte CMD Terminal
  if (!vscode.window.activeTerminal) {
    var tbterm = vscode.window.createTerminal('TeraByte CMD',tbos_exe);
    outputChannel.append('Created new terminal\n');
  }

  //---------------------------------------------------------------------
  //- Otherwise Kill the Current One Then Re-create TeraByte CMD Terminal
  else {
  var CurrentTerminal = vscode.window.activeTerminal.name;
    if (CurrentTerminal == 'TeraByte CMD') {
      var tbterm = vscode.window.activeTerminal;
      tbterm.dispose();
    }
    var tbterm = vscode.window.createTerminal('TeraByte CMD',tbos_exe);
  }

  tbterm.sendText(StartProcess);
  tbterm.show(true);
    
};

//---------------------------------------
//--- Run Script in External TBCMD ------
//     (Default Hot Key Shift F6)
//---------------------------------------
function RunScriptExternal() {

  //console.log('External TBCMD Command');

  //----------------------------------
  //--- Document Name and Path Strings
  var ActiveDocument = vscode.window.activeTextEditor.document.fileName;
  var ActiveDocumentPath = path.dirname(ActiveDocument);
  var ActiveDocumentName = path.basename(ActiveDocument);
  //  var ActiveDocumentExt = path.extname(ActiveDocument);

  //-------------------------------------------------
  //--- If Document is Dirty Then Save the File First
  let DirtyFlag = vscode.window.activeTextEditor.document.isDirty;
  if (DirtyFlag) {
    //console.log("Document is Dirty Saving Now");
    let SaveCommand = vscode.window.activeTextEditor.document.save;
    SaveCommand();
  };

  //----------------------
  //--- Show Output Window
  outputChannel.show(true);
  outputChannel.clear();
  outputChannel.append('--------------------------------------------------------------------------------\n');
  outputChannel.append('Running script...: '+ActiveDocumentName+'\n');
  outputChannel.append('From Folder......: '+ActiveDocumentPath+'\n');
  outputChannel.append('--------------------------------------------------------------------------------\n');

  //------------------------------------
  //--- Run The Script in External TBCMD
  var execScriptcmd = tbos_exe;
  vscode.env.openExternal(ActiveDocument)
  // outputChannel.append(execScriptcmd+'\n');
  // var result = cp.exec(execScriptcmd,[
  //   {
  //   cwd: ActiveDocumentPath,
  //   env: process.env,
  //   //shell: true,
  //   stdio: 'inherit',
  //   encoding: 'utf-8'
  //   }]);


  //--- this works when run from cmd.exe as administrator
  // C:\c64\code\my_code\testtbscript>tbosdtw64.exe >err1.txt displayhdinfo.tbs

};

//--- Called Everytime User Makes an Edit (Basically Every Key Press)
function fileChanged(e) {
  // // when not working on extension file, get out!
  // if (e.document.languageId != 'assembler') {
  //     return;
  // }
  // let selDoc = vscode.window.activeTextEditor.document.fileName;
  // let ActiveDocumet = selDoc

//  console.log("Document Changed");

};

//--- Called Everytime User Selects Different Tab or Window
function activeTextEditor(editor) {
  //- If not in editor window then return
  if (!editor) {
      return;
  }
  //- When not working on tbscript extension document return
  if (editor.document.languageId != 'tbscript') {
      return;
  }
  //console.log("Active Document Changed");
  
};

function deactivate() {}
