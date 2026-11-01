const { spawn } = require('child_process');
const path = require('path');
const readline = require('readline');
const net = require('net');
const fs = require('fs');

console.log('\x1b[33m====================================================\x1b[0m');
console.log('\x1b[1m\x1b[36m  🚀 Starting Smart Dan Peti Full-Stack Development\x1b[0m');
console.log('  • Backend API  : \x1b[32mhttp://localhost:5000\x1b[0m');
console.log('  • Frontend App : \x1b[32mhttp://localhost:5174\x1b[0m');
console.log('  • Database     : \x1b[32mMySQL (port 3306 / smart_dan_peti)\x1b[0m');
console.log('\x1b[33m====================================================\x1b[0m\n');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

// Auto-check and start MySQL if using XAMPP
function ensureMysql(callback) {
  function checkPort(cb) {
    const socket = new net.Socket();
    socket.setTimeout(600);
    socket.on('connect', () => {
      socket.destroy();
      cb(true);
    });
    socket.on('error', () => {
      socket.destroy();
      cb(false);
    });
    socket.on('timeout', () => {
      socket.destroy();
      cb(false);
    });
    socket.connect(3306, '127.0.0.1');
  }

  checkPort((isOpen) => {
    if (isOpen) {
      console.log('\x1b[32m[Database] MySQL service detected and running on port 3306.\x1b[0m');
      return callback();
    }

    const xamppMysqld = 'C:\\xampp\\mysql\\bin\\mysqld.exe';
    const xamppIni = 'C:\\xampp\\mysql\\bin\\my.ini';
    if (fs.existsSync(xamppMysqld) && fs.existsSync(xamppIni)) {
      console.log('\x1b[33m[Database] Auto-starting MySQL service from XAMPP...\x1b[0m');
      try {
        const proc = spawn(xamppMysqld, [`--defaults-file=${xamppIni}`, '--standalone'], {
          detached: true,
          stdio: 'ignore'
        });
        proc.unref();
      } catch (e) {}

      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        checkPort((ready) => {
          if (ready) {
            clearInterval(interval);
            console.log('\x1b[32m[Database] MySQL service started successfully and connected.\x1b[0m');
            callback();
          } else if (attempts > 10) {
            clearInterval(interval);
            console.log('\x1b[33m[Database Notice] Proceeding to start servers...\x1b[0m');
            callback();
          }
        });
      }, 500);
    } else {
      console.log('\x1b[33m[Database Notice] MySQL port check finished.\x1b[0m');
      callback();
    }
  });
}

function startProcess(name, colorPrefix, cmd, args, cwd) {
  const child = spawn(cmd, args, {
    cwd,
    shell: isWin,
    stdio: ['inherit', 'pipe', 'pipe'],
    env: { ...process.env, FORCE_COLOR: '1' }
  });

  if (child.stdout) {
    const rlOut = readline.createInterface({ input: child.stdout });
    rlOut.on('line', (line) => {
      console.log(`${colorPrefix} ${line}`);
    });
  }

  if (child.stderr) {
    const rlErr = readline.createInterface({ input: child.stderr });
    rlErr.on('line', (line) => {
      console.error(`${colorPrefix} ${line}`);
    });
  }

  child.on('error', (err) => {
    console.error(`${colorPrefix} Failed to start:`, err);
  });

  child.on('close', (code) => {
    if (code !== 0 && code !== null) {
      console.log(`${colorPrefix} exited with code ${code}`);
    }
  });

  return child;
}

ensureMysql(() => {
  const backendProcess = startProcess(
    'backend',
    '\x1b[36m[BACKEND]\x1b[0m',
    npmCmd,
    ['run', 'dev'],
    path.join(__dirname, 'backend')
  );

  const frontendProcess = startProcess(
    'frontend',
    '\x1b[35m[FRONTEND]\x1b[0m',
    npmCmd,
    ['run', 'dev'],
    path.join(__dirname, 'frontend')
  );

  let cleanedUp = false;
  function cleanup() {
    if (cleanedUp) return;
    cleanedUp = true;
    console.log('\n\x1b[33m[Shutting down Smart Dan Peti servers...]\x1b[0m');

    try {
      if (isWin) {
        if (backendProcess.pid) spawn('taskkill', ['/pid', backendProcess.pid, '/f', '/t']);
        if (frontendProcess.pid) spawn('taskkill', ['/pid', frontendProcess.pid, '/f', '/t']);
      } else {
        backendProcess.kill('SIGTERM');
        frontendProcess.kill('SIGTERM');
      }
    } catch (e) {}

    setTimeout(() => {
      process.exit(0);
    }, 400);
  }

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
});
