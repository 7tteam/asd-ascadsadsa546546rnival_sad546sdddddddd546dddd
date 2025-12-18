// Sidebar Management
function openSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    sidebar.classList.remove('d-none');
    overlay.classList.remove('d-none');
    
    // Add animation
    setTimeout(() => {
        sidebar.classList.add('show');
    }, 10);
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    sidebar.classList.remove('show');
    
    setTimeout(() => {
        sidebar.classList.add('d-none');
        overlay.classList.add('d-none');
    }, 400);
}

// Sidebar navigation
document.addEventListener('DOMContentLoaded', function() {
    // Sidebar menu items
    document.querySelectorAll('.sidebar-item[data-section]').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            
            // Hide all sections
            document.querySelectorAll('.section-content').forEach(sec => {
                sec.classList.add('d-none');
            });
            
            // Show selected section
            if (section === 'home') {
                // Show main hero section
                document.querySelector('.hero-section').style.display = 'block';
                document.querySelector('.container.mt-4').style.display = 'block';
            } else {
                // Hide hero section and show specific section
                document.querySelector('.hero-section').style.display = 'none';
                document.querySelector('.container.mt-4').style.display = 'none';
                
                const sectionElement = document.getElementById(section + 'Section');
                if (sectionElement) {
                    sectionElement.classList.remove('d-none');
                }
            }
            
            // Update bottom navigation
            document.querySelectorAll('.nav-item').forEach(nav => {
                nav.classList.remove('active');
            });
            
            const bottomNavItem = document.querySelector(`.nav-item[data-section="${section}"]`);
            if (bottomNavItem) {
                bottomNavItem.classList.add('active');
            }
            
            closeSidebar();
        });
    });
    
    // Bottom navigation
    document.querySelectorAll('.nav-item[data-section]').forEach(item => {
        item.addEventListener('click', function() {
            const section = this.dataset.section;
            
            // Remove active class from all items
            document.querySelectorAll('.nav-item').forEach(nav => {
                nav.classList.remove('active');
            });
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Hide all sections
            document.querySelectorAll('.section-content').forEach(sec => {
                sec.classList.add('d-none');
            });
            
            // Show selected section
            if (section === 'home') {
                document.querySelector('.hero-section').style.display = 'block';
                document.querySelector('.container.mt-4').style.display = 'block';
            } else {
                document.querySelector('.hero-section').style.display = 'none';
                document.querySelector('.container.mt-4').style.display = 'none';
                
                const sectionElement = document.getElementById(section + 'Section');
                if (sectionElement) {
                    sectionElement.classList.remove('d-none');
                }
            }
        });
    });
    
    // Close sidebar when clicking overlay
    document.getElementById('sidebarOverlay').addEventListener('click', closeSidebar);
    
    // Close sidebar on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeSidebar();
        }
    });
});