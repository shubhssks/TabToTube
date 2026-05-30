const levels = {
  info: "INFO",
  warn: "WARN",
  error: "ERROR"
};

function write(level, message) {
  const timestamp = new Date().toISOString();
  const normalized = message instanceof Error ? message.stack || message.message : message;
  console.log(`[${timestamp}] [${levels[level]}] ${normalized}`);
}

module.exports = {
  info(message) {
    write("info", message);
  },
  warn(message) {
    write("warn", message);
  },
  error(message) {
    write("error", message);
  }
};

