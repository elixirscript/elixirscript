function MatchError(message) {
  this.name = 'MatchError';
  this.message = message || 'No match for arguments given';
  this.stack = (new Error()).stack;
}

MatchError.prototype = Object.create(Error.prototype);
MatchError.prototype.constructor = MatchError;

export default MatchError;
