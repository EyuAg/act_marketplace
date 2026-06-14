// Listing interactions
document.addEventListener('DOMContentLoaded', function() {
    // Save/unsave listing
    const saveButtons = document.querySelectorAll('.save-listing');
    saveButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const listingId = btn.dataset.id;
            const response = await fetch(`/saved/toggle/${listingId}`, { method: 'POST' });
            const data = await response.json();
            
            if (data.saved) {
                btn.classList.add('saved');
                btn.innerHTML = '❤️ Saved';
            } else {
                btn.classList.remove('saved');
                btn.innerHTML = '♡ Save';
            }
        });
    });
});