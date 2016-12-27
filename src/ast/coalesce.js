/*!
 * Copyright (C) 2017 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

var Statement = require('./statement');
var KIND = 'coalesce';

/**
 * Verify is the test property is defined and is not null, and returns
 * is, otherwise returns the ifnull expression.
 * @constructor Coalesce
 * @extends {Statement}
 * @property {Expression} test - The expression to be testes
 * @property {Expression} ifnull - The returned expression if test is null
 * @see https://wiki.php.net/rfc/isset_ternary
 */
var Coalesce = Statement.extends(function Coalesce(test, ifnull, location) {
  Statement.apply(this, [KIND, location]);
  this.test = test;
  this.ifnull = ifnull;
});

module.exports = Coalesce;
