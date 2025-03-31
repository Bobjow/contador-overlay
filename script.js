document.addEventListener('DOMContentLoaded', () => {
    const apiKeys = [
        "AIzaSyAUs6SFHwoQXbUcwaB7ll2vJNl0tiATWL4",
        "CHAVE_API_V2_AQUI",
        "CHAVE_API_V3_AQUI"
    ];
    let currentKeyIndex = 0;
    const channelId = "UCfxuVyjFhkf4gj_HyCnxLRg";
    let meta = 100;
    let currentMessage = 0;
    const messages = document.querySelectorAll('.msg');
    const gemText = document.querySelector('#messageBox .msg:last-child');
    let isLive = false;

    // Função para alternar chaves
    const cycleApiKey = () => {
        currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    };

    // Função principal (inalterada da sua versão original)
    const updateLikes = async () => {
        try {
            const liveResponse = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${apiKeys[currentKeyIndex]}`);
            const liveData = await liveResponse.json();
            
            if (liveData.items?.length > 0) {
                const videoId = liveData.items[0].id.videoId;
                const statsResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${apiKeys[currentKeyIndex]}`);
                const statsData = await statsResponse.json();
                const likes = parseInt(statsData.items[0].statistics.likeCount) || 0;
                
                // Atualização da interface (mantida igual)
                document.getElementById("progressBar").style.width = `${(likes/meta)*100}%`;
                document.getElementById("likeText").textContent = `${likes.toString().padStart(5, '0')} / ${meta}`;

                if (likes >= meta) {
                    meta += 100;
                    gemText.innerHTML = `META: <img src="gemas-png.png" class="gem-glow gem-icon" style="width:45px !important; height:45px !important; vertical-align:middle; margin-right:10px; display: inline-block;"> ${meta}`;
                }
            }
        } catch(error) {
            console.log("Erro detectado, alternando chave...");
            cycleApiKey();
        }
    };

    // Sistema de rotação de mensagens (inalterado)
    const rotateMessages = () => {
        messages.forEach(msg => msg.classList.remove('active'));
        messages[currentMessage].classList.add('active');
        currentMessage = (currentMessage + 1) % 3;
    };

    // Intervalos originais
    setInterval(updateLikes, 300000);
    setInterval(rotateMessages, 5000);
    updateLikes();
    
    // Garante que a primeira mensagem seja visível
    messages[0].classList.add('active'); // 👈 Correção crítica
});