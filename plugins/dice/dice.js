// Parses the this grammar and calculates the result:
//
//     expr   ::= '[' expr '+' term ']' | '[' term ']'
//     term   ::= term '*' form | form
//     form   ::= form 'd' factor | factor
//     factor ::= '(' expr ')' | number
//     number ::= '-' digit+ | digit+
//     digit  ::= '0' | '1' | ... | '9'

ReParse = require('reparse').ReParse;

module.exports = read;

function read(input) {
	return (new ReParse(input, true)).start(brackets);
}

function line() {
	return this.match(/\[[\dd\+\*\-\/\.\(\)]*\]/g);
}

function brackets() {
	return this.between(/^\[/, /^\]/, expr);
}

function expr() {
	return this.chainl1(term, addop);
}

function term() {
	return this.chainl1(form, mulop);
}

function form() {
	return this.chainl1(factor, diceop);
}

function factor() {
	return this.choice(group, number);
}

function group() {
	return this.between(/^\(/, /^\)/, expr);
}

function number() {
	return parseFloat(this.match(/^\-?\d*\.?\d+/));
}

function diceop() {
	return OPS[this.match(/^[dD]/)];
}

function mulop() {
	return OPS[this.match(/^[\*\/]/)];
}

function addop() {
	return OPS[this.match(/^[\+\-]/)];
}

function dice(a, b) {
	var sum = [0, []];
	for(var i = 0; i < a; i++) {
		var r = Math.floor(Math.random() * b) + 1;
		sum[0] += r;
		sum[1].push(r);
	}
	return sum;
}

function objOp(op, a, b) {
	if(typeof a === 'object' && typeof b === 'number') {
		a[0] = op(a[0], b);
		a[1].push(b);
		return a;
	} else if(typeof a === 'object' && typeof b === 'object') {
		a[0] = op(a[0], b[0]);
		a[1] = a[1].concat(b[1]);
		return a;
	} else if(typeof a === 'number' && typeof b === 'object') {
		b[0] = op(a, b[0]);
		b[1].push(a);
		return b;
	} else if(typeof a === 'number' && typeof b === 'number') {
		return [op(a, b), [a, b]];
	}
}

function add(a, b) {
	return a + b;
}

function sub(a, b) {
	return a - b;
}

function mul(a, b) {
	return a * b;
}

function div(a, b) {
	return a / b;
}

var OPS = {
	'd': dice,
	'D': dice,
	'+': function(a, b) { return objOp(add, a, b); },
	'-': function(a, b) { return objOp(sub, a, b); },
	'*': function(a, b) { return objOp(mul, a, b); },
	'/': function(a, b) { return objOp(div, a, b); }
};
