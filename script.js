document.addEventListener('DOMContentLoaded', () => {
    // 🔑 Adicione SUAS 3 API Keys (mantenha a ordem)
    const apiKeys = [
        "AIzaSyAUs6SFHwoQXbUcwaB7ll2vJNl0tiATWL4",
        "AIzaSyA8gSkzWGn9YhXoLjRPcdwuh2ESyt3eUJE",
        "AIzaSyD0RYlWMxtWdqBU7-rnvIh2c-XLVGsgvxQ"
    ];
    
    const CHANNEL_ID = "UC_5voh8cFDi0JIX3mAzLbng"; // 👇 Use seu ID real aqui
    let meta = 100;
    let currentMessage = 0;
    const messages = document.querySelectorAll('.msg');
    const gemText = document.querySelector('#messageBox .msg:last-child');
    let keyIndex = 0;
    let currentVideoId = null;
    let checkInterval = 600000; // 10min inicial

    // Rotação de mensagens (intacta)
    const rotateMessages = () => {
        messages.forEach(msg => msg.classList.remove('active'));
        messages[currentMessage].classList.add('active');
        currentMessage = (currentMessage + 1) % 3;
    };

    // 🔄 Sistema inteligente de verificação
    const checkLive = async () => {
        try {
            const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=id&channelId=${CHANNEL_ID}&eventType=live&type=video&key=${apiKeys[keyIndex]}`);
            
            if(response.status === 403) {
                keyIndex = (keyIndex + 1) % apiKeys.length;
                checkInterval = 600000; // Reset para 10min
                return;
            }

            const data = await response.json();
            currentVideoId = data.items[0]?.id?.videoId || currentVideoId;
            
            // Ajusta intervalo dinamicamente
            checkInterval = currentVideoId ? 1800000 : Math.min(checkInterval * 1.5, 3600000);
            
        } catch(error) {
            console.error("Erro na verificação:", error);
            checkInterval = Math.min(checkInterval * 2, 3600000);
        } finally {
            setTimeout(checkLive, checkInterval);
        }
    };

    // ⚡ Atualização otimizada de likes
    const updateLikes = async () => {
        if(!currentVideoId) return;

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

    // 🎯 Gatilhos manuais para verificação imediata
    document.getElementById('progressBar').addEventListener('click', () => {
        checkInterval = 600000;
        checkLive();
    });

    // ⚙️ Intervalos conservadores
    setInterval(updateLikes, 60000); // 1min
    setInterval(rotateMessages, 5000);
    checkLive(); // Inicia ciclo
    messages[0].classList.add('active');
});