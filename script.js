document.addEventListener('DOMContentLoaded', () => {
    const apiKeys = [
        "AIzaSyAUs6SFHwoQXbUcwaB7ll2vJNl0tiATWL4",
        "AIzaSyA8gSkzWGn9YhXoLjRPcdwuh2ESyt3eUJE",
        "AIzaSyD0RYlWMxtWdqBU7-rnvIh2c-XLVGsgvxQ"
    ];
    
    const CHANNEL_ID = "UC_5voh8cFDi0JIX3mAzLbng";
    let meta = 100;
    let keyIndex = 0;
    let currentVideoId = null;

    // 🟢 Debug: Mostra chave atual
    const showKeyStatus = () => {
        console.log(`Usando chave ${keyIndex + 1}/${apiKeys.length}: ${apiKeys[keyIndex].slice(0, 15)}...`);
    };

    // 🔄 Sistema aprimorado de troca de chaves
    const rotateKey = () => {
        keyIndex = (keyIndex + 1) % apiKeys.length;
        console.warn(`Troca para chave ${keyIndex + 1} devido a erro 403`);
        showKeyStatus();
    };

    // ✅ Verificação de live com tratamento completo
    const checkLive = async () => {
        try {
            showKeyStatus();
            const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=id&channelId=${CHANNEL_ID}&eventType=live&type=video&key=${apiKeys[keyIndex]}`);
            
            console.log(`Status: ${response.status}`, response);
            
            if(response.status === 403) {
                rotateKey();
                return checkLive(); // Tenta imediatamente com nova chave
            }

            if(!response.ok) {
                console.error(`Erro HTTP: ${response.status}`);
                return;
            }

            const data = await response.json();
            currentVideoId = data.items[0]?.id?.videoId;
            console.log(currentVideoId ? "Live detectada!" : "Nenhuma live ativa");

        } catch(error) {
            console.error("Erro fatal:", error);
            rotateKey();
        }
    };

    // ⚡ Atualização de likes otimizada
    const updateLikes = async () => {
        if(!currentVideoId) return;

        try {
            const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${currentVideoId}&key=${apiKeys[keyIndex]}`);
            
            if(response.status === 403) {
                rotateKey();
                return updateLikes(); // Retry com nova chave
            }

            const data = await response.json();
            const likes = parseInt(data.items[0]?.statistics?.likeCount) || 0;
            
            console.log(`Likes atualizados: ${likes}`);

            // Atualize sua UI aqui...

        } catch(error) {
            console.error("Erro nos likes:", error);
            rotateKey();
        }
    };

    // 🕒 Intervalos ajustados
    setInterval(() => {
        checkLive();
        if(currentVideoId) updateLikes();
    }, 30000); // 30 segundos

    // 🔍 Teste inicial
    checkLive();
});