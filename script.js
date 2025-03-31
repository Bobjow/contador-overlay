document.addEventListener('DOMContentLoaded', () => {
    // Configurações
    const API_KEYS = [
        "AIzaSyAUs6SFHwoQXbUcwaB7ll2vJNl0tiATWL4",
        "AIzaSyA8gSkzWGn9YhXoLjRPcdwuh2ESyt3eUJE",
        "AIzaSyD0RYlWMxtWdqBU7-rnvIh2c-XLVGsgvxQ"
    ];
    const CHANNEL_ID = "UC_5voh8cFDi0JIX3mAzLbng";
    
    // Variáveis (mantive todos os nomes originais)
    let meta = 100;
    let currentMessage = 0;
    const messages = document.querySelectorAll('.msg');
    const gemText = document.querySelector('#messageBox .msg:last-child');
    let keyIndex = 0;
    let currentVideoId = null;
    let isLiveActive = false;
    let checkTimer = null;

    // Rotação de mensagens (original)
    const rotateMessages = () => {
        messages.forEach(msg => msg.classList.remove('active'));
        messages[currentMessage].classList.add('active');
        currentMessage = (currentMessage + 1) % 3;
    };

    // Sistema de verificação (novo)
    const checkLive = async () => {
        if(checkTimer) clearTimeout(checkTimer);
        
        try {
            const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=id&channelId=${CHANNEL_ID}&eventType=live&type=video&key=${API_KEYS[keyIndex]}`);
            
            if(response.status === 403) {
                keyIndex = (keyIndex + 1) % API_KEYS.length;
                checkTimer = setTimeout(checkLive, 30000);
                return;
            }

            const data = await response.json();
            const newVideoId = data.items[0]?.id?.videoId;

            if(newVideoId) {
                isLiveActive = true;
                currentVideoId = newVideoId;
                checkTimer = setTimeout(checkLive, 300000);
                updateLikes();
            } else {
                isLiveActive = false;
                currentVideoId = null;
                checkTimer = setTimeout(checkLive, 900000);
            }

        } catch(error) {
            checkTimer = setTimeout(checkLive, 600000);
        }
    };

    // Atualização de likes (original + otimização)
    const updateLikes = async () => {
        if(!isLiveActive) return;

        try {
            const statsResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${currentVideoId}&key=${API_KEYS[keyIndex]}`);
            
            if(statsResponse.status === 403) {
                keyIndex = (keyIndex + 1) % API_KEYS.length;
                return;
            }

            const statsData = await statsResponse.json();
            const likes = parseInt(statsData.items[0]?.statistics?.likeCount) || 0;

            // Atualização da UI (original)
            document.getElementById("progressBar").style.width = `${(likes/meta)*100}%`;
            document.getElementById("likeText").textContent = `${likes.toString().padStart(5, '0')} / ${meta}`;

            if(likes >= meta) {
                meta += 100;
                gemText.innerHTML = `META: <img src="gemas-png.png" class="gem-glow gem-icon" 
                    style="width:45px !important; height:45px !important; vertical-align:middle; margin-right:10px; display: inline-block;"> ${meta}`;
            }

        } catch(error) {
            console.error("Erro:", error);
        }
    };

    // Feedback (nova funcionalidade)
    document.getElementById('progressBar').addEventListener('click', () => {
        const feedback = document.createElement('div');
        feedback.id = "live-feedback";
        feedback.textContent = "ATUALIZANDO...";
        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 2000);
        
        checkLive();
    });

    // Inicialização (original)
    setInterval(updateLikes, 60000);
    setInterval(rotateMessages, 5000);
    checkLive();
    messages[0].classList.add('active');
});