const net = require('net');

// კონფიგურაცია
const config = {
    host: '127.0.0.1',
    port: 8085
};

function checkPort(host, port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(3000); // 3 წამი timeout

        socket.on('connect', () => {
            console.log(`✅ API სერვისი ჩართულია და უსმენს პორტს ${port}`);
            socket.destroy();
            resolve(true);
        });

        socket.on('timeout', () => {
            console.log(`⏰ Timeout: API არ უპასუხა პორტზე ${port}`);
            socket.destroy();
            resolve(false);
        });

        socket.on('error', (err) => {
            console.log(`❌ API სერვისი არ მუშაობს პორტზე ${port}`);
            socket.destroy();
            resolve(false);
        });

        socket.connect(port, host);
    });
}

(async () => {
    console.log('🔎 Checking FINA Web API on localhost...');
    const result = await checkPort(config.host, config.port);
    if (!result) {
        console.log('💡 რჩევა: გადაამოწმე FINA Web API პროგრამა ან სერვისი, და აამუშავე.');
    }
})();
