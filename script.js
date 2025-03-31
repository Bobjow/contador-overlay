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

    // Rotação de mensagens
    const rotateMessages = () => {
        messages.forEach(msg => msg.classList.remove('active'));
        messages[currentMessage].classList.add('active');
        currentMessage = (currentMessage + 1) % 3;
    };

    // Sistema de verificação inteligente
    const checkLive = async () => {
        if(checkTimer) clearTimeout(checkTimer);
        
        try {
            const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=id&channelId=${CHANNEL_ID}&eventType=live&type=video&key=${apiKeys[keyIndex]}`);
            
            // Tratamento de erros
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
                document.getElementById("status").textContent = "LIVE ATIVA!";
                checkTimer = setTimeout(checkLive, 300000);
                updateLikes();
            } else {
                isLiveActive = false;
                currentVideoId = null;
                document.getElementById("status").textContent = "AGUARDANDO LIVE...";
                checkTimer = setTimeout(checkLive, 900000);
            }

        } catch(error) {
            console.error("Erro geral:", error);
            checkTimer = setTimeout(checkLive, 600000);
        }
    };

    // Atualização de likes
    const updateLikes = async () => {
        if(!isLiveActive) return;

        try {
            const statsResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${currentVideoId}&key=${apiKeys[keyIndex]}`);
            
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
            }

        } catch(error) {
            console.error("Erro nos likes:", error);
        }
    };

    // Feedback visual ao clicar
    document.getElementById('progressBar').addEventListener('click', () => {
        // Cria elemento de feedback
        const feedback = document.createElement('div');
        feedback.textContent = "Atualizando... ⌛";
        feedback.style.position = 'fixed';
        feedback.style.bottom = '20px';
        feedback.style.left = '50%';
        feedback.style.transform = 'translateX(-50%)';
        feedback.style.backgroundColor = 'rgba(0,0,0,0.7)';
        feedback.style.color = '#00ff88';
        feedback.style.padding = '10px 20px';
        feedback.style.borderRadius = '5px';
        feedback.style.zIndex = '1000';
        feedback.id = 'live-feedback';
        
        document.body.appendChild(feedback);
        
        // Atualiza verificações
        checkLive();
        document.getElementById("status").textContent = "VERIFICANDO...";
        
        // Remove feedback após 2 segundos
        setTimeout(() => {
            const feedbackElement = document.getElementById('live-feedback');
            if(feedbackElement) {
                document.body.removeChild(feedbackElement);
            }
        }, 2000);
    });

    // Inicialização
    setInterval(updateLikes, 60000);
    setInterval(rotateMessages, 5000);
    checkLive();
    messages[0].classList.add('active');
});