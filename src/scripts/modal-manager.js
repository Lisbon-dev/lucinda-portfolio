/**
 * Modal Manager with WCAG 2.1 AA Compliance
 * Handles focus management, keyboard navigation, and accessibility
 */

class ModalManager {
  constructor() {
    this.activeModal = null;
    this.previousFocus = null;
    this.focusableElements = [];
    this.firstFocusableElement = null;
    this.lastFocusableElement = null;
    
    // Bind methods to preserve context
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.close = this.close.bind(this);
  }

  /**
   * Get all focusable elements within a container
   */
  getFocusableElements(container) {
    const focusableSelectors = [
      'button',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"]):not([disabled])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors))
      .filter(element => {
        // Filter out elements that are not actually focusable
        return element.offsetWidth > 0 && 
               element.offsetHeight > 0 && 
               !element.hasAttribute('disabled') &&
               element.getAttribute('tabindex') !== '-1';
      });
  }

  /**
   * Open modal with accessibility compliance
   */
  open(modalId, triggerElement = null) {
    const modal = document.getElementById(modalId);
    if (!modal || this.activeModal === modalId) return;

    // Store the element that triggered the modal
    this.previousFocus = triggerElement || document.activeElement;
    
    // Close any existing modal first
    if (this.activeModal) {
      this.close();
    }

    this.activeModal = modalId;

    // Show modal
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('modal--active');

    // Disable background scrolling
    document.body.style.overflow = 'hidden';

    // Mark background content as inert
    this.setBackgroundInert(true);

    // Set up focus management
    this.setupFocusManagement(modal);

    // Set initial focus
    this.setInitialFocus(modal);

    // Add event listeners
    document.addEventListener('keydown', this.handleKeyDown);
    modal.addEventListener('click', this.handleClick);

    // Announce to screen readers
    this.announceModalOpened(modal);

    // Dispatch custom event for header integration
    document.dispatchEvent(new CustomEvent('modal:opened', { 
      detail: { modalId: this.activeModal }
    }));
  }

  /**
   * Close the active modal
   */
  close() {
    if (!this.activeModal) return;

    const modal = document.getElementById(this.activeModal);
    if (!modal) return;

    // Hide modal
    modal.setAttribute('aria-hidden', 'true');
    modal.classList.remove('modal--active');

    // Re-enable background scrolling
    document.body.style.overflow = '';

    // Remove inert from background content
    this.setBackgroundInert(false);

    // Remove event listeners
    document.removeEventListener('keydown', this.handleKeyDown);
    modal.removeEventListener('click', this.handleClick);

    // Restore focus
    const shouldRestoreFocus = modal.getAttribute('data-restore-focus') !== 'false';
    if (shouldRestoreFocus && this.previousFocus) {
      // Use setTimeout to ensure modal is hidden before focusing
      setTimeout(() => {
        if (this.previousFocus && typeof this.previousFocus.focus === 'function') {
          this.previousFocus.focus();
        }
      }, 100);
    }

    // Clear references
    const closedModalId = this.activeModal;
    this.activeModal = null;
    this.previousFocus = null;
    this.focusableElements = [];
    this.firstFocusableElement = null;
    this.lastFocusableElement = null;

    // Announce to screen readers
    this.announceModalClosed();

    // Dispatch custom event for header integration
    document.dispatchEvent(new CustomEvent('modal:closed', { 
      detail: { modalId: closedModalId }
    }));
  }

  /**
   * Set up focus management for the modal
   */
  setupFocusManagement(modal) {
    this.focusableElements = this.getFocusableElements(modal);
    this.firstFocusableElement = this.focusableElements[0] || null;
    this.lastFocusableElement = this.focusableElements[this.focusableElements.length - 1] || null;
  }

  /**
   * Set initial focus based on modal configuration
   */
  setInitialFocus(modal) {
    const initialFocusSelector = modal.getAttribute('data-initial-focus');
    let targetElement = null;

    if (initialFocusSelector) {
      targetElement = modal.querySelector(initialFocusSelector);
    }

    // Fallback hierarchy for initial focus
    if (!targetElement) {
      // Try to find the close button
      targetElement = modal.querySelector('[data-modal-close]');
    }

    if (!targetElement) {
      // Try first focusable element
      targetElement = this.firstFocusableElement;
    }

    if (!targetElement) {
      // Focus the modal itself as last resort
      modal.setAttribute('tabindex', '-1');
      targetElement = modal;
    }

    if (targetElement) {
      setTimeout(() => {
        targetElement.focus();
      }, 100);
    }
  }

  /**
   * Handle keyboard events for accessibility
   */
  handleKeyDown(event) {
    if (!this.activeModal) return;

    const modal = document.getElementById(this.activeModal);
    const closeOnEscape = modal.getAttribute('data-close-on-escape') !== 'false';

    switch (event.key) {
      case 'Escape':
        if (closeOnEscape) {
          event.preventDefault();
          this.close();
        }
        break;

      case 'Tab':
        this.handleTabNavigation(event);
        break;
    }
  }

  /**
   * Handle tab navigation within modal (focus trapping)
   */
  handleTabNavigation(event) {
    if (!this.firstFocusableElement || !this.lastFocusableElement) return;

    if (event.shiftKey) {
      // Shift + Tab (backwards)
      if (document.activeElement === this.firstFocusableElement) {
        event.preventDefault();
        this.lastFocusableElement.focus();
      }
    } else {
      // Tab (forwards)
      if (document.activeElement === this.lastFocusableElement) {
        event.preventDefault();
        this.firstFocusableElement.focus();
      }
    }
  }

  /**
   * Handle click events (close on backdrop click)
   */
  handleClick(event) {
    if (!this.activeModal) return;

    const modal = document.getElementById(this.activeModal);
    const closeOnOverlay = modal.getAttribute('data-close-on-overlay') !== 'false';

    // Close button clicked
    if (event.target.closest('[data-modal-close]')) {
      event.preventDefault();
      this.close();
      return;
    }

    // Backdrop clicked
    if (closeOnOverlay && event.target.hasAttribute('data-modal-backdrop')) {
      this.close();
    }
  }

  /**
   * Mark background content as inert
   */
  setBackgroundInert(inert) {
    const modal = document.getElementById(this.activeModal);
    if (!modal) return;

    const allElements = document.body.children;
    
    for (let element of allElements) {
      if (element !== modal) {
        if (inert) {
          element.setAttribute('inert', '');
          element.setAttribute('aria-hidden', 'true');
        } else {
          element.removeAttribute('inert');
          element.removeAttribute('aria-hidden');
        }
      }
    }
  }

  /**
   * Announce modal opened to screen readers
   */
  announceModalOpened(modal) {
    const title = modal.querySelector('.modal__title')?.textContent || 'Modal dialog';
    this.announceToScreenReader(`${title} opened`);
  }

  /**
   * Announce modal closed to screen readers
   */
  announceModalClosed() {
    this.announceToScreenReader('Modal dialog closed');
  }

  /**
   * Create live region announcement for screen readers
   */
  announceToScreenReader(message) {
    // Create or find existing live region
    let liveRegion = document.getElementById('modal-live-region');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'modal-live-region';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      document.body.appendChild(liveRegion);
    }

    // Clear and set message
    liveRegion.textContent = '';
    setTimeout(() => {
      liveRegion.textContent = message;
    }, 100);
  }
}

// Create global modal manager instance
const modalManager = new ModalManager();

/**
 * Initialize modal triggers
 */
export function initializeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  // Find all triggers for this modal
  const triggers = document.querySelectorAll(`[data-modal-trigger="${modalId}"]`);
  
  triggers.forEach(trigger => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      modalManager.open(modalId, trigger);
    });

    // Add aria attributes to trigger
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');
  });

  // Update trigger aria-expanded when modal state changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'aria-hidden') {
        const isHidden = modal.getAttribute('aria-hidden') === 'true';
        triggers.forEach(trigger => {
          trigger.setAttribute('aria-expanded', isHidden ? 'false' : 'true');
        });
      }
    });
  });

  observer.observe(modal, { attributes: true });
}

/**
 * Public API for opening modals
 */
export function openModal(modalId, triggerElement = null) {
  modalManager.open(modalId, triggerElement);
}

/**
 * Public API for closing modals
 */
export function closeModal() {
  modalManager.close();
}

/**
 * Check if a modal is currently active
 */
export function isModalActive() {
  return modalManager.activeModal !== null;
}

/**
 * Get the currently active modal ID
 */
export function getActiveModalId() {
  return modalManager.activeModal;
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Auto-initialize modals found on page
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      const modalId = modal.getAttribute('data-modal-id');
      if (modalId) {
        initializeModal(modalId);
      }
    });
  });
} else {
  // DOM already loaded, initialize immediately
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    const modalId = modal.getAttribute('data-modal-id');
    if (modalId) {
      initializeModal(modalId);
    }
  });
}