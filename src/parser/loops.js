/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */
"use strict";

var Position = require("../ast/position.js");

module.exports = {
  /**
   * Reads a while statement
   * ```ebnf
   * while ::= T_WHILE (statement | ':' inner_statement_list T_ENDWHILE ';')
   * ```
   * @see https://github.com/php/php-src/blob/master/Zend/zend_language_parser.y#L587
   * @return {While}
   */
  read_while: function() {
    const result = this.node("while");
    this.expect(this.tok.T_WHILE) && this.next();
    let test = null;
    let body = null;
    let shortForm = false;
    if (this.expect("(")) this.next();
    test = this.read_expr();
    if (this.expect(")")) this.next();
    if (this.token === ":") {
      shortForm = true;
      body = this.read_short_form(this.tok.T_ENDWHILE);
    } else {
      body = this.read_statement();
    }
    return result(test, body, shortForm);
  },
  /**
   * Reads a do / while loop
   * ```ebnf
   * do ::= T_DO statement T_WHILE '(' expr ')' ';'
   * ```
   * @see https://github.com/php/php-src/blob/master/Zend/zend_language_parser.y#L423
   * @return {Do}
   */
  read_do: function() {
    const result = this.node("do");
    this.expect(this.tok.T_DO) && this.next();
    let test = null;
    let body = null;
    body = this.read_statement();
    if (this.expect(this.tok.T_WHILE)) {
      if (this.next().expect("(")) this.next();
      test = this.read_expr();
      if (this.expect(")")) this.next();
      if (this.expect(";")) this.next();
    }
    return result(test, body);
  },
  /**
   * Read a for incremental loop
   * ```ebnf
   * for ::= T_FOR '(' for_exprs ';' for_exprs ';' for_exprs ')' for_statement
   * for_statement ::= statement | ':' inner_statement_list T_ENDFOR ';'
   * for_exprs ::= expr? (',' expr)*
   * ```
   * @see https://github.com/php/php-src/blob/master/Zend/zend_language_parser.y#L425
   * @return {For}
   */
  read_for: function() {
    const result = this.node("for");
    this.expect(this.tok.T_FOR) && this.next();
    let init = [];
    let test = [];
    let increment = [];
    let body = null;
    let shortForm = false;
    if (this.expect("(")) this.next();
    let leftParLoc = new Position(), 
        fstSemiColLoc = new Position(), 
        sndSemiColLoc = new Position(),
        rightParLoc = new Position();
    leftParLoc.line = this.prev[0];
    leftParLoc.column = this.prev[1] - 1;
    leftParLoc.offset = this.prev[2];
    if (this.token !== ";") {
      init = this.read_list(this.read_expr, ",");
      if (this.expect(";")) {
        this.next();
        fstSemiColLoc.line = this.prev[0];
        fstSemiColLoc.column = this.prev[1] - 1;
        fstSemiColLoc.offset = this.prev[2];
      }
    } else {
      this.next();
      fstSemiColLoc.line = this.prev[0];
      fstSemiColLoc.column = this.prev[1] - 1;
      fstSemiColLoc.offset = this.prev[2];
    }
    if (this.token !== ";") {
      test = this.read_list(this.read_expr, ",");
      if (this.expect(";")) {
        this.next();
        sndSemiColLoc.line = this.prev[0];
        sndSemiColLoc.column = this.prev[1] - 1;
        sndSemiColLoc.offset = this.prev[2];
      }
    } else {
      this.next();
      sndSemiColLoc.line = this.prev[0];
      sndSemiColLoc.column = this.prev[1] - 1;
      sndSemiColLoc.offset = this.prev[2];
    }
    if (this.token !== ")") {
      increment = this.read_list(this.read_expr, ",");
      if (this.expect(")")) {
        this.next();
        rightParLoc.line = this.prev[0];
        rightParLoc.column = this.prev[1] - 1;
        rightParLoc.offset = this.prev[2];
      }
    } else {
      this.next();
      rightParLoc.line = this.prev[0];
      rightParLoc.column = this.prev[1] - 1;
      rightParLoc.offset = this.prev[2];
    }
    if (this.token === ":") {
      shortForm = true;
      body = this.read_short_form(this.tok.T_ENDFOR);
    } else {
      body = this.read_statement();
    }
    let for_node = result(init, test, increment, body, shortForm);
    for_node.loc.leftParLoc = leftParLoc;
    for_node.loc.rightParLoc = rightParLoc;
    for_node.loc.fstSemiColLoc = fstSemiColLoc;
    for_node.loc.sndSemiColLoc = sndSemiColLoc;
    return for_node;
  },
  /**
   * Reads a foreach loop
   * ```ebnf
   * foreach ::= '(' expr T_AS foreach_variable (T_DOUBLE_ARROW foreach_variable)? ')' statement
   * ```
   * @see https://github.com/php/php-src/blob/master/Zend/zend_language_parser.y#L438
   * @return {Foreach}
   */
  read_foreach: function() {
    const result = this.node("foreach");
    this.expect(this.tok.T_FOREACH) && this.next();
    let source = null;
    let key = null;
    let value = null;
    let body = null;
    let shortForm = false;
    let leftParLoc = new Position(),
        rightParLoc = new Position(),
        asLoc = new Position(),
        arrowLoc = new Position();
    if (this.expect("(")) {
      this.next();
      leftParLoc.line = this.prev[0];
      leftParLoc.column = this.prev[1] - 1;
      leftParLoc.offset = this.prev[2];
    }
    source = this.read_expr();
    if (this.expect(this.tok.T_AS)) {
      this.next();
      asLoc.line = this.prev[0];
      asLoc.column = this.prev[1] - 2;
      asLoc.offset = this.prev[2];
      value = this.read_foreach_variable();
      if (this.token === this.tok.T_DOUBLE_ARROW) {
        key = value;
        this.next();
        arrowLoc.line = this.prev[0];
        arrowLoc.column = this.prev[1] - 2;
        arrowLoc.offset = this.prev[2];
        value = this.read_foreach_variable();
      }
    }

    // grammatically correct but not supported by PHP
    if (key && key.kind === "list") {
      this.raiseError("Fatal Error : Cannot use list as key element");
    }

    if (this.expect(")")) {
      this.next();
      rightParLoc.line = this.prev[0];
      rightParLoc.column = this.prev[1] - 1;
      rightParLoc.offset = this.prev[2];
    }

    if (this.token === ":") {
      shortForm = true;
      body = this.read_short_form(this.tok.T_ENDFOREACH);
    } else {
      body = this.read_statement();
    }
    let foreach_node = result(source, key, value, body, shortForm);
    foreach_node.loc.leftParLoc = leftParLoc;
    foreach_node.loc.rightParLoc = rightParLoc;
    foreach_node.loc.asLoc = asLoc;
    foreach_node.loc.arrowLoc = arrowLoc;
    return foreach_node;
  },
  /**
   * Reads a foreach variable statement
   * ```ebnf
   * foreach_variable =
   *    variable |
   *    '&' variable |
   *    T_LIST '(' assignment_list ')' |
   *    '[' assignment_list ']'
   * ```
   * @see https://github.com/php/php-src/blob/master/Zend/zend_language_parser.y#L544
   * @return {Expression}
   */
  read_foreach_variable: function() {
    if (this.token === this.tok.T_LIST || this.token === "[") {
      const isShort = this.token === "[";
      const result = this.node("list");
      this.next();
      if (!isShort && this.expect("(")) this.next();
      const assignList = this.read_array_pair_list(isShort);
      if (this.expect(isShort ? "]" : ")")) this.next();
      return result(assignList, isShort);
    } else {
      return this.read_variable(false, false);
    }
  }
};
