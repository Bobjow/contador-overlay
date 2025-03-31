document.addEventListener('DOMContentLoaded', () => {
    const apiKeys = [
        "AIzaSyAUs6SFHwoQXbUcwaB7ll2vJNl0tiATWL4",
        "AIzaSyA8gSkzWGn9YhXoLjRPcdwuh2ESyt3eUJE",
        "AIzaSyD0RYlWMxtWdqBU7-rnvIh2c-XLVGsgvxQ"
    ];
    
    const CHANNEL_ID = "UC_5voh8cFDi0JIX3mAzLbng";
    let meta = 100;
    let currentMessage = 0;
    const messages = document.querySelectorAll('.msg');
    const gemText = document.querySelector('#messageBox .msg:last-child');
    let keyIndex = 0;
    let currentVideoId = null;
    let isLiveActive = false;
    let checkTimer = null;

    const rotateMessages = () => {
        messages.forEach(msg => msg.classList.remove('active'));
        messages[currentMessage].classList.add('active');
        currentMessage = (currentMessage + 1) % 3;
    };

    const checkLive = async () => {
        if(checkTimer) clearTimeout(checkTimer);
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // Timeout de 10s
            
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${CHANNEL_ID}&eventType=live&type=video&key=${apiKeys[keyIndex]}`,
                { signal: controller.signal }
            );
            
            clearTimeout(timeoutId);

            if(response.status === 403) {
                keyIndex = (keyIndex + 1) % apiKeys.length;
                checkTimer = setTimeout(checkLive, 30000);
                return;
            }

            const data = await response.json();
            const newVideoId = data.items[0]?.id?.videoId;

            if(newVideoId) {
                isLiveActive = true;
                currentVideoId = newVideoId;
                checkTimer = setTimeout(checkLive, 600000); // Verifica a cada 10min quando ao vivo
                updateLikes();
            } else {
                isLiveActive = false;
                currentVideoId = null;
                checkTimer = setTimeout(checkLive, 900000); // 15min quando offline
            }

        } catch(error) {
            console.error(error.name === 'AbortError' ? "Timeout: Tentando novamente..." : error);
            checkTimer = setTimeout(checkLive, 60000); // Retry após 1min em erros
        }
    };

    const updateLikes = async () => {
        if(!isLiveActive) return;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const statsResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${currentVideoId}&key=${apiKeys[keyIndex]}`,
                { signal: controller.signal }
            );
            
            clearTimeout(timeoutId);

            if(statsResponse.status === 403) {
                keyIndex = (keyIndex + 1) % apiKeys.length;
                return;
            }

            const statsData = await statsResponse.json();
            const likes = parseInt(statsData.items[0]?.statistics?.likeCount) || 0;

            document.getElementById("progressBar").style.width = `${(likes/meta)*100}%`;
            document.getElementById("likeText").textContent = `${likes.toString().padStart(5, '0')} / ${meta}`;

            if(likes >= meta) {
                meta += 100;
                gemText.innerHTML = `META: <img src="gemas-png.png" class="gem-glow gem-icon" 
                    style="width:45px !important; height:45px !important; vertical-align:middle; margin-right:10px; display: inline-block;"> ${meta}`;
                rotateMessages();
            }

            // Agenda próxima atualização
            if(isLiveActive) setTimeout(updateLikes, 30000); // 30s entre atualizações

        } catch(error) {
            console.error("Erro nos likes:", error);
            if(isLiveActive) setTimeout(updateLikes, 60000);
        }
    };

    document.getElementById('progressBar').addEventListener('click', () => {
        const feedback = document.createElement('div');
        feedback.textContent = "Atualizando... ⌛";
        feedback.id = 'live-feedback';
        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 2000);
        checkLive();
    });

    // Inicialização
    checkLive();
    messages[0].classList.add('active');
});