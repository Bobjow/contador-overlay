document.addEventListener('DOMContentLoaded', () => {
    const apiKeys = ["AIzaSyA8gSkzWGn9YhXoLjRPcdwuh2ESyt3eUJE"];
    const CHANNEL_ID = "SEU_CHANNEL_ID"; // 🔑 Adicione seu Channel ID aqui
    let meta = 100;
    let currentMessage = 0;
    const messages = document.querySelectorAll('.msg');
    const gemText = document.querySelector('#messageBox .msg:last-child');

    // Rotação de mensagens (mantido intacto)
    const rotateMessages = () => {
        messages.forEach(msg => msg.classList.remove('active'));
        messages[currentMessage].classList.add('active');
        currentMessage = (currentMessage + 1) % 3;
    };

    // 🆕 Função para detectar a live ativa automaticamente
    const getLiveVideoId = async () => {
        try {
            const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=id&channelId=${CHANNEL_ID}&eventType=live&type=video&key=${apiKeys[0]}`);
            const data = await response.json();
            return data.items[0]?.id?.videoId || null;
        } catch(error) {
            console.error("Erro ao buscar live:", error);
            return null;
        }
    };

    // 👇 Atualização ajustada para detectar live automaticamente
    const updateLikes = async () => {
        try {
            const VIDEO_ID = await getLiveVideoId();
            
            if(!VIDEO_ID) {
                console.log("Nenhuma live ativa detectada!");
                return;
            }

            const statsResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${VIDEO_ID}&key=${apiKeys[0]}&nocache=${Date.now()}`);
            
            if (!statsResponse.ok) throw new Error("Erro na API");
            
            const statsData = await statsResponse.json();
            const likes = parseInt(statsData.items[0].statistics.likeCount) || 0;

            // Atualização visual (mantido intacto)
            document.getElementById("progressBar").style.width = `${(likes/meta)*100}%`;
            document.getElementById("likeText").textContent = `${likes.toString().padStart(5, '0')} / ${meta}`;

            if (likes >= meta) {
                meta += 100;
                gemText.innerHTML = `META: <img src="gemas-png.png" class="gem-glow gem-icon" 
                    style="width:45px !important; height:45px !important; vertical-align:middle; margin-right:10px; display: inline-block;"> ${meta}`;
            }

        } catch(error) {
            console.error("Erro geral:", error);
        }
    };

    // Intervalos mantidos (ajustar se necessário)
    setInterval(updateLikes, 10000);
    setInterval(rotateMessages, 5000);
    updateLikes();
    messages[0].classList.add('active');
});