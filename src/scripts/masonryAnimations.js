// masonryAnimations.js - Motion.js animation system for masonry grid
// Handles smooth scroll-based reveals with cellart.com-style animations

import { animate, inView } from 'motion';

// Debug Motion.js availability
console.log('Motion.js imports available:', { animate, inView });

export class MasonryAnimations {
  constructor(containerId) {
    this.containerId = containerId;
    this.containerElement = null;
    this.masonryContainer = null;
    this.revealCleanups = [];
    this.animationsInitialized = false;
    this.eagerImagesLoaded = 0;
    
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupAnimations());
    } else {
      this.setupAnimations();
    }
  }

  setupAnimations() {
    // Find the masonry grid for this specific component instance
    this.containerElement = document.getElementById(this.containerId);
    if (!this.containerElement) {
      console.warn(`MasonryAnimations: Container with ID "${this.containerId}" not found`);
      return;
    }
    
    this.masonryContainer = this.containerElement.querySelector('.masonry-grid');
    if (!this.masonryContainer) {
      console.warn('MasonryAnimations: .masonry-grid not found within container');
      return;
    }

    console.log('MasonryAnimations: Setting up animations for container:', this.containerId);

    // Setup image loading tracking
    this.setupImageLoading();
    
    // Setup scroll reveals for lazy items
    this.setupScrollReveals();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Add fallback timer
    this.setupFallbackTimer();
  }

  // Motion.js reveal animations (cellart.com-style) with device optimization
  createRevealAnimation(element, delay = 0) {
    // Detect device capabilities for performance optimization
    const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      // Show immediately for reduced motion preference
      element.style.opacity = '1';
      element.style.transform = 'none';
      return null;
    }
    
    const animation = animate(
      element,
      {
        opacity: [0, 1],
        transform: isLowEndDevice 
          ? ['translate3d(0, 20px, 0)', 'translate3d(0, 0, 0)'] // Simpler animation for low-end devices
          : ['translate3d(0, 40px, 0) scale(0.95)', 'translate3d(0, 0, 0) scale(1)']
      },
      {
        duration: isLowEndDevice ? 0.4 : 0.8, // Faster on low-end devices
        ease: [0.25, 0.46, 0.45, 0.94], // cellart.com cubic-bezier
        delay
      }
    );
    return animation;
  }

  // Scroll-triggered animation setup with performance optimization
  setupScrollReveal(element, index) {
    const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      element.style.opacity = '1';
      element.style.transform = 'none';
      return () => {}; // Return empty cleanup function
    }
    
    return inView(
      element,
      () => {
        this.createRevealAnimation(element, isLowEndDevice ? index * 0.05 : index * 0.1);
      },
      { 
        margin: isLowEndDevice ? '-10% 0px -5% 0px' : '-20% 0px -10% 0px' // Earlier trigger on low-end devices
      }
    );
  }

  setupImageLoading() {
    const totalImages = this.masonryContainer.querySelectorAll('.masonry-image').length;
    const eagerImages = Math.min(3, totalImages);
    
    console.log(`MasonryAnimations: Found ${totalImages} images, ${eagerImages} eager images expected`);

    // Enhanced progress update function
    const updateLoadingProgressSafely = (progress, retries = 0) => {
      const maxRetries = 10;
      const retryDelay = 50;
      
      if (window.updateLoadingProgress) {
        console.log(`MasonryAnimations: Updating progress to ${progress}%`);
        window.updateLoadingProgress(progress);
      } else if (retries < maxRetries) {
        setTimeout(() => {
          updateLoadingProgressSafely(progress, retries + 1);
        }, retryDelay);
      }
    };

    // Handle image load events
    const handleImageLoad = (img, isEager = false) => {
      const container = img.closest('.image-container');
      const masonryItem = container?.closest('.masonry-item');
      
      if (container) {
        container.setAttribute('data-loaded', 'true');
      }
      
      if (isEager) {
        this.eagerImagesLoaded++;
        console.log(`MasonryAnimations: Eager image ${this.eagerImagesLoaded}/${eagerImages} loaded`);
        
        const progress = Math.min(100, (this.eagerImagesLoaded / eagerImages) * 100);
        updateLoadingProgressSafely(progress);
      }

      // Initialize animations after eager images load
      if (this.eagerImagesLoaded >= eagerImages && !this.animationsInitialized) {
        this.initializeEagerAnimations();
      }
    };

    // Check for already loaded images (cached images)
    const images = this.masonryContainer.querySelectorAll('.masonry-image');
    images.forEach((img, index) => {
      const isEager = img.loading === 'eager';
      if (img.complete && img.naturalWidth > 0) {
        console.log(`MasonryAnimations: Image ${index} already loaded (cached)`);
        handleImageLoad(img, isEager);
      }
    });

    // Listen for image load events
    this.masonryContainer.addEventListener('load', (event) => {
      const target = event.target;
      if (target?.tagName === 'IMG' && target.classList.contains('masonry-image')) {
        const isEager = target.loading === 'eager';
        handleImageLoad(target, isEager);
      }
    }, true);
  }

  initializeEagerAnimations() {
    this.animationsInitialized = true;
    console.log('MasonryAnimations: Initializing eager item animations');
    
    // Update progress to 100%
    if (window.updateLoadingProgress) {
      window.updateLoadingProgress(100);
    }
    
    setTimeout(() => {
      // Reveal eager items immediately with Motion.js
      const eagerItems = this.masonryContainer.querySelectorAll('.masonry-item:not([data-lazy="true"])');
      eagerItems.forEach((item, index) => {
        if (!item.dataset.motionRevealed) {
          this.createRevealAnimation(item, index * 0.15);
          item.dataset.motionRevealed = 'true';
        }
      });

      // Setup scroll-based reveal for lazy items
      this.setupScrollRevealsForLazyItems();
    }, 100);
  }

  setupScrollReveals() {
    // Initial setup for lazy items if animations are already initialized
    if (this.animationsInitialized) {
      this.setupScrollRevealsForLazyItems();
    }
  }

  setupScrollRevealsForLazyItems() {
    const lazyItems = this.masonryContainer.querySelectorAll('.masonry-item[data-lazy="true"]');
    lazyItems.forEach((item, index) => {
      if (!item.dataset.motionRevealed) {
        const cleanup = this.setupScrollReveal(item, index);
        this.revealCleanups.push(cleanup);
        item.dataset.motionRevealed = 'true';
      }
    });
  }

  setupEventListeners() {
    // Listen for loading complete event from overlay
    document.addEventListener('loadingComplete', () => {
      console.log('MasonryAnimations: Loading complete event received');
      
      // Ensure content is visible and animations can start
      if (!this.animationsInitialized) {
        this.initializeFallbackAnimations();
      }
    });

    // Handle reduced motion preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      const items = this.masonryContainer.querySelectorAll('.masonry-item');
      items.forEach(item => {
        item.style.opacity = '1';
        item.style.transform = 'none';
      });
    }

    // Setup cleanup listeners
    this.setupCleanupListeners();
    
    // Setup Astro view transitions compatibility
    this.setupViewTransitionsCompatibility();
  }

  initializeFallbackAnimations() {
    console.log('MasonryAnimations: Initializing fallback animations after loading complete');
    this.animationsInitialized = true;
    
    setTimeout(() => {
      // Reveal all items if not already revealed
      const allItems = this.masonryContainer.querySelectorAll('.masonry-item');
      allItems.forEach((item, index) => {
        if (!item.dataset.motionRevealed) {
          const isEager = !item.dataset.lazy;
          const delay = isEager ? index * 0.15 : (index - 3) * 0.1; // Offset for lazy items
          this.createRevealAnimation(item, Math.max(0, delay));
          item.dataset.motionRevealed = 'true';
        }
      });
    }, 200);
  }

  setupFallbackTimer() {
    // Fallback: ensure items are visible after 1 second regardless
    setTimeout(() => {
      if (!this.animationsInitialized) {
        console.warn('MasonryAnimations: Fallback timer triggered - showing items immediately');
        const items = this.masonryContainer.querySelectorAll('.masonry-item');
        items.forEach(item => {
          item.style.opacity = '1';
          item.style.transform = 'translate3d(0, 0, 0) scale(1)';
        });
      }
    }, 1000);
  }

  setupCleanupListeners() {
    const cleanupAnimations = () => {
      this.revealCleanups.forEach(cleanup => {
        try {
          if (typeof cleanup === 'function') cleanup();
        } catch (error) {
          console.warn('MasonryAnimations: Error during animation cleanup:', error);
        }
      });
      this.revealCleanups.length = 0;
    };
    
    // Multiple cleanup listeners for reliability
    window.addEventListener('beforeunload', cleanupAnimations);
    window.addEventListener('pagehide', cleanupAnimations);
    
    // Cleanup on component destruction (for SPA navigation)
    document.addEventListener('astro:before-preparation', cleanupAnimations);
    document.addEventListener('astro:before-swap', cleanupAnimations);
  }

  setupViewTransitionsCompatibility() {
    // Handle Astro view transitions
    document.addEventListener('astro:after-swap', () => {
      console.log('MasonryAnimations: View transition completed, reinitializing animations');
      
      // Reset state for new page
      this.animationsInitialized = false;
      this.eagerImagesLoaded = 0;
      this.revealCleanups.length = 0;
      
      // Find new container after transition
      this.containerElement = document.getElementById(this.containerId);
      if (this.containerElement) {
        this.masonryContainer = this.containerElement.querySelector('.masonry-grid');
        if (this.masonryContainer) {
          // Reinitialize animations for new page content
          setTimeout(() => {
            this.setupImageLoading();
            this.setupScrollReveals();
          }, 50);
        }
      }
    });

    // Handle page preparation (before transition starts)
    document.addEventListener('astro:before-preparation', () => {
      console.log('MasonryAnimations: Preparing for view transition');
      
      // Ensure all items are visible before transition to prevent flash
      if (this.masonryContainer) {
        const items = this.masonryContainer.querySelectorAll('.masonry-item');
        items.forEach(item => {
          item.style.opacity = '1';
          item.style.transform = 'translate3d(0, 0, 0) scale(1)';
        });
      }
    });
  }
}

// Export the class for use in other modules
export { MasonryAnimations };
