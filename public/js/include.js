/**
 * include.js - Load header and footer components
 * This script loads the header and footer components into each page
 * and highlights the active navigation link based on the current page.
 */

document.addEventListener('DOMContentLoaded', function() {
  // Load header
  const headerPlaceholder = document.getElementById('header-placeholder');
  if (headerPlaceholder) {
    fetch('/includes/header.html')
      .then(response => response.text())
      .then(data => {
        headerPlaceholder.innerHTML = data;
        highlightActiveNavLink();
      })
      .catch(error => console.error('Error loading header:', error));
  }

  // Load footer
  const footerPlaceholder = document.getElementById('footer-placeholder');
  if (footerPlaceholder) {
    fetch('/includes/footer.html')
      .then(response => response.text())
      .then(data => {
        footerPlaceholder.innerHTML = data;
      })
      .catch(error => console.error('Error loading footer:', error));
  }
});

/**
 * Highlights the active navigation link based on the current page
 */
function highlightActiveNavLink() {
  // Get current page filename
  const currentPage = window.location.pathname.split('/').pop();
  
  // Default active class
  const activeClass = 'text-primary font-medium border-b-2 border-primary pb-1';
  // Default inactive class
  const inactiveClass = 'text-gray-800 hover:text-primary font-medium';
  
  // Reset all navigation links
  document.querySelectorAll('nav a').forEach(link => {
    link.className = inactiveClass;
  });
  
  // Set active link based on current page
  if (currentPage === '' || currentPage === 'index.html') {
    const homeLink = document.getElementById('nav-home');
    if (homeLink) homeLink.className = activeClass;
  } else if (currentPage === 'match.html') {
    const matchLink = document.getElementById('nav-match');
    if (matchLink) matchLink.className = activeClass;
  } else if (currentPage === 'community.html') {
    const communityLink = document.getElementById('nav-community');
    if (communityLink) communityLink.className = activeClass;
  } else if (currentPage.includes('mypage')) {
    const mypageLink = document.getElementById('nav-mypage');
    if (mypageLink) mypageLink.className = activeClass;
  }
}