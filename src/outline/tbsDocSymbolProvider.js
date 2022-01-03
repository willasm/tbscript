"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const vscode = require("vscode");

class tbsDocumentSymbolProvider {

    provideDocumentSymbols(document, token) {

        // Results Found Array
        const result = [];

        // Subroutine (Sub) Name
        const subNameRegex = /^\s*sub\s+([a-zA-Z0-9]+)/i;

        // Constants (const)
        const constNameRegex = /^\s*const\s+([a-zA-Z0-9_]+)/i;

        // Globals (global)
        const globalNameRegex = /^\s*global\s+([a-zA-Z0-9]+)/i;

        let prevConstName = null;
        let prevGlobalName = null;
        let prevSubName = null;

        for (let line = 0; line < document.lineCount; line++) {
            const { text } = document.lineAt(line);

            // Matching Subroutine Name
            const subMatched = text.match(subNameRegex);
            // Matching Constant Name
            const constMatched = text.match(constNameRegex);
            // Matching Global Name
            const globalMatched = text.match(globalNameRegex);

            if (subMatched) {
                // Record the information of the new subroutine
                const subLoc = new vscode.Location(document.uri, new vscode.Position(line, 0));
                result.push(new vscode.SymbolInformation(subMatched[1], vscode.SymbolKind.Function, prevSubName, subLoc));
                prevSubName = subMatched[1];
                continue;
            }
            if (constMatched) {
                const constLoc = new vscode.Location(document.uri, new vscode.Position(line, 0));
                result.push(new vscode.SymbolInformation(constMatched[1], vscode.SymbolKind.Constant, prevConstName, constLoc));
                prevConstName = constMatched[1];
                continue;
            }
            if (globalMatched) {
                prevGlobalName = globalMatched[1];
                const globalLoc = new vscode.Location(document.uri, new vscode.Position(line, 0));
                result.push(new vscode.SymbolInformation(globalMatched[1], vscode.SymbolKind.Variable, prevGlobalName, globalLoc));
                continue;
            }
        }
        return result;
    }
}

exports.tbsDocumentSymbolProvider = tbsDocumentSymbolProvider;