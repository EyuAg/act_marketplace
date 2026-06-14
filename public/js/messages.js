document.getElementById('messageForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const message = document.getElementById('messageInput').value;
    const receiverId = document.getElementById('receiverId').value;

    if (!message.trim()) return;

    const res = await fetch('/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiver_id: receiverId, message })
    });

    if (res.ok) {
        location.reload(); // Refresh to show new message
    } else {
        alert('Failed to send message');
    }
});