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
    let checkInterval = 600000;

    // Rotação de mensagens (intacta)
    const rotateMessages = () => {
        messages.forEach(msg => msg.classList.remove('active'));
        messages[currentMessage].classList.add('active');
        currentMessage = (currentMessage + 1) % 3;
    };

    // 🔄 Sistema de verificação com retentativa imediata
    const checkLive = async (retry = false) => {
        try {
            const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=id&channelId=${CHANNEL_ID}&eventType=live&type=video&key=${apiKeys[keyIndex]}`);
            
            if(response.status === 403) {
                console.log(`Rotacionando chave (atual: ${keyIndex})`);
                keyIndex = (keyIndex + 1) % apiKeys.length;
                if(retry) return; // Evita loop infinito
                return checkLive(true); // Retentativa imediata
            }

            const data = await response.json();
            currentVideoId = data.items[0]?.id?.videoId || currentVideoId;
            
            checkInterval = currentVideoId ? 1800000 : Math.min(checkInterval * 1.5, 3600000);
            
        } catch(error) {
            console.error("Erro na verificação:", error);
            checkInterval = Math.min(checkInterval * 2, 3600000);
        } finally {
            setTimeout(checkLive, checkInterval);
        }
    };

    // ⚡ Atualização de likes com retry automático
    const updateLikes = async (retry = false) => {
        if(!currentVideoId) return;

        try {
            const statsResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${currentVideoId}&key=${apiKeys[keyIndex]}`);
            
            if(statsResponse.status === 403) {
                console.log(`Rotacionando chave (atual: ${keyIndex})`);
                keyIndex = (keyIndex + 1) % apiKeys.length;
                if(retry) return;
                return updateLikes(true);
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

    // 🎯 Restante do código mantido
    document.getElementById('progressBar').addEventListener('click', () => {
        checkInterval = 600000;
        checkLive();
    });

    setInterval(updateLikes, 60000);
    setInterval(rotateMessages, 5000);
    checkLive();
    messages[0].classList.add('active');
});