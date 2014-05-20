var Executor = require('../lib/exec'),
  assert = require('chai').assert;

describe('executor', function() {
  it('add properties', function() {
    var exec = new Executor('a_B', 'bcd_aff');
    assert(typeof exec.aB == 'function' && typeof exec.bcdAff == 'function');
    exec = new Executor(['a__b', 'b_c_d']);
    assert(typeof exec.aB == 'function' && typeof exec.bCD == 'function');
  });
});