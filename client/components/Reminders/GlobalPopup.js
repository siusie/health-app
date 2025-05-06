// File: client/components/Reminders/GlobalPopup.js

import React, { useState, useEffect, useRef } from 'react';
import { Button, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faBell, faCheck, faClock, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useNotifications } from '@/context/NotificationContext';
import styles from './GlobalPopup.module.css';

// Separate component to avoid hydration issues
const GlobalReminderPopup = () => {
  const [isComponentMounted, setIsComponentMounted] = useState(false);
  
  // Force client-side rendering to avoid hydration issues
  useEffect(() => {
    setIsComponentMounted(true);
  }, []);
  
  // Only render on client side
  if (!isComponentMounted) {
    return null;
  }
  
  return <MountedGlobalReminderPopup />;
};

// Main component that renders after mounting
const MountedGlobalReminderPopup = () => {
  const {
    hasNotifications,
    totalNotifications,
    currentNotification,
    currentIndex,
    dismissNotification,
    completeReminder,
    showNextNotification,
    showPrevNotification,
    isClient,
    isAuthenticated,
    audioRef
  } = useNotifications();

  // Local state
  const [showDelayOptions, setShowDelayOptions] = useState(false);
  const [customDelay, setCustomDelay] = useState(15); // Default 15 minutes
  const [isClosing, setIsClosing] = useState(false);
  const popupRef = useRef(null);

  // Animation timing
  const ANIMATION_DURATION = 300; // ms

  // Debug logs to help troubleshoot
  useEffect(() => {
  }, [isClient, isAuthenticated, hasNotifications, totalNotifications, currentNotification]);

  // Don't render if not client-side or no notifications
  if (!isClient) {
    return null;
  }
  
  if (!hasNotifications || !currentNotification) {
    return null;
  }

  // Handle the close/dismiss action with animation
  const handleDismiss = () => {
    if (!currentNotification) return;
    
    // Start closing animation
    setIsClosing(true);
    
    // Delay the actual dismissal to allow animation to complete
    setTimeout(() => {
      try {
        dismissNotification(currentNotification.id, 5); // Delay by 5 minutes
      } catch (err) {
        console.error("Error dismissing notification:", err);
      }
      setIsClosing(false);
    }, ANIMATION_DURATION);
  };

  // Handle completing a reminder
  const handleComplete = () => {
    if (!currentNotification) return;
    
    // Start closing animation
    setIsClosing(true);
    
    // Delay the actual completion to allow animation to complete
    setTimeout(() => {
      try {
        completeReminder(currentNotification.id);
      } catch (err) {
        console.error("Error completing reminder:", err);
      }
      setIsClosing(false);
    }, ANIMATION_DURATION);
  };

  // Handle custom delay submission
  const handleDelaySubmit = (e) => {
    e.preventDefault();
    if (!currentNotification) return;
    
    // Start closing animation
    setIsClosing(true);
    
    // Delay the actual dismissal to allow animation to complete
    setTimeout(() => {
      try {
        dismissNotification(currentNotification.id, customDelay);
      } catch (err) {
        console.error("Error delaying notification:", err);
      }
      setShowDelayOptions(false);
      setIsClosing(false);
    }, ANIMATION_DURATION);
  };

  // Format time for display
  const formatTime = (date) => {
    if (!date) return '';
    try {
      const options = { hour: 'numeric', minute: 'numeric', hour12: true };
      return new Date(date).toLocaleTimeString(undefined, options);
    } catch (err) {
      console.error("Error formatting time:", err);
      return "Invalid time";
    }
  };

  // Get baby name or default to "Baby X"
  const getBabyName = () => {
    if (!currentNotification) return "";
    return currentNotification.babyName || `Baby ${currentNotification.babyId || ""}`;
  };

  // Safely render with error boundaries
  try {
    return (
      <div 
        className={`${styles.popupContainer} ${isClosing ? styles.slideOut : styles.slideIn}`}
        ref={popupRef}
      >
        <div className={styles.popup}>
          <div className={styles.header}>
            <div className={styles.title}>
              <FontAwesomeIcon icon={faBell} className={styles.bellIcon} />
              <span>
                {currentNotification.isEarlyNotification ? 'Upcoming Reminder' : 'Reminder'}
                {totalNotifications > 1 ? ` (${currentIndex + 1}/${totalNotifications})` : ''}
              </span>
            </div>
            <button 
              className={styles.closeButton} 
              onClick={handleDismiss}
              aria-label="Close reminder"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          
          <div className={styles.content}>
            <h3 className={styles.reminderTitle}>
              {currentNotification.title}
              {getBabyName() && (
                <span className={styles.babyTag}>{getBabyName()}</span>
              )}
            </h3>
            
            <div className={styles.reminderTime}>
              <FontAwesomeIcon icon={faClock} className={styles.clockIcon} />
              <span className={currentNotification.isOverdue ? styles.overdue : ''}>
                {currentNotification.isOverdue ? 'Overdue: ' : ''}
                {formatTime(currentNotification.time)}
              </span>
            </div>
            
            {currentNotification.note && (
              <p className={styles.reminderNote}>{currentNotification.note}</p>
            )}
          </div>
          
          <div className={styles.actions}>
            {showDelayOptions ? (
              <Form onSubmit={handleDelaySubmit} className={styles.delayForm}>
                <Form.Group className={styles.delayGroup}>
                  <Form.Label>Delay for minutes:</Form.Label>
                  <div className={styles.delayInputGroup}>
                    <Form.Control
                      type="number"
                      value={customDelay}
                      onChange={(e) => setCustomDelay(parseInt(e.target.value) || 15)}
                      min="1"
                      max="1440" // Max 24 hours
                    />
                    <div className={styles.delayButtons}>
                      <Button type="submit" variant="primary" size="sm">Set</Button>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => setShowDelayOptions(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Form.Group>
              </Form>
            ) : (
              <>
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={() => setShowDelayOptions(true)}
                >
                  Delay
                </Button>
                <Button 
                  variant="success" 
                  size="sm"
                  onClick={handleComplete}
                >
                  Complete
                </Button>
                
                {totalNotifications > 1 && (
                  <div className={styles.navigation}>
                    <Button 
                      variant="link" 
                      size="sm"
                      onClick={showPrevNotification}
                      aria-label="Previous notification"
                    >
                      <FontAwesomeIcon icon={faChevronLeft} />
                    </Button>
                    <Button 
                      variant="link" 
                      size="sm"
                      onClick={showNextNotification}
                      aria-label="Next notification"
                    >
                      <FontAwesomeIcon icon={faChevronRight} />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error rendering GlobalReminderPopup:", error);
    // Fallback to simpler UI in case of render error
    return (
      <div className={styles.popupContainer}>
        <div className={styles.popup}>
          <div className={styles.header}>
            <div className={styles.title}>
              <FontAwesomeIcon icon={faBell} className={styles.bellIcon} />
              <span>Reminder</span>
            </div>
            <button 
              className={styles.closeButton} 
              onClick={handleDismiss}
              aria-label="Close reminder"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className={styles.content}>
            <h3 className={styles.reminderTitle}>Error displaying reminder</h3>
            <p className={styles.reminderNote}>There was an error displaying this reminder.</p>
          </div>
        </div>
      </div>
    );
  }
};

export default GlobalReminderPopup;