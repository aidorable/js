if (typeof window.DorableSurveyWidget === 'undefined') {
    class DorableSurveyWidget {
        constructor(config) {
            this.surveyId = config.surveyId;
            this.subdomain = config.subdomain;
            this.position = config.position || 'bottom-right';
            this.env = config.env || 'prod';
            this.isMinimized = false;
            this.hideForNDaysAfterSubmit = config.hideForNDaysAfterSubmit || 30;
            this.hideForNDaysAfterDismiss = config.hideForNDaysAfterDismiss || 7;
            this.deviceType = config.deviceType || 'all';
            this.userIdentifier = config.userIdentifier || null;
            
            if (this.deviceType !== 'all') {
                const isMobile = window.innerWidth <= 768;
                if ((this.deviceType === 'desktop' && isMobile) || 
                    (this.deviceType === 'mobile' && !isMobile)) {
                    return;
                }
            }
            
            const lastCompleted = localStorage.getItem(`survey_${this.surveyId}_completed`);
            const lastDismissed = localStorage.getItem(`survey_${this.surveyId}_dismissed`);
            
            if (lastCompleted && (Date.now() - new Date(lastCompleted).getTime()) < this.hideForNDaysAfterSubmit * 24 * 60 * 60 * 1000) {
                return;
            }
            
            if (lastDismissed && this.hideForNDaysAfterDismiss > 0 && 
                (Date.now() - new Date(lastDismissed).getTime()) < this.hideForNDaysAfterDismiss * 24 * 60 * 60 * 1000) {
                return;
            }
            
            this.init();
        }

        init() {
            const widget = document.createElement('iframe');
            widget.id = `dorable-survey-widget-${Math.random().toString(36).substr(2, 9)}`;
            
            widget.style.display = 'none';
            
            let widgetUrl;
            if(this.env != 'dev'){
                widgetUrl = `https://${this.subdomain}.dorable.ai/survey/${this.surveyId}/widget`;
            }else{
                widgetUrl = `http://localhost:5173/survey/${this.surveyId}/widget?subdomain=${this.subdomain}`;
            }
            
            if (this.userIdentifier) {
                widgetUrl += (widgetUrl.includes('?') ? '&' : '?') + `user_identifier=${encodeURIComponent(this.userIdentifier)}`;
            }
            widget.src = widgetUrl;
            
            widget.style.width = '420px';
            widget.style.height = '400px';
            widget.style.maxWidth = 'calc(100% - 40px)';
            widget.style.border = 'none';
            widget.style.position = 'fixed';
            widget.style.zIndex = '9999';
            widget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
            widget.style.borderRadius = '8px';
            widget.style.backgroundColor = 'white';
            
            if (this.position === 'bottom-right') {
                widget.style.bottom = '20px';
                widget.style.right = '20px';
            } else if (this.position === 'bottom-left') {
                widget.style.bottom = '20px';
                widget.style.left = '20px';
            }
            
            window.addEventListener('message', (event) => {
                if (event.origin !== 'http://localhost:5173' && event.origin.indexOf('dorable.ai') == -1) return;
                
                console.log(event)

                if (event.data.type === 'toggleMinimize') {
                    this.isMinimized = event.data.isMinimized;
                    widget.style.height = this.isMinimized ? '57px' : '400px';
                    
                    if (this.isMinimized && event.data.isThankYouPage) {
                        document.body.removeChild(widget);
                    }
                }

                if (event.data.type === 'toggleMinimize' && localStorage.getItem(`survey_${this.surveyId}_completed`)) {
                    document.body.removeChild(widget);
                }

                if (event.data.type === 'close') {
                    document.body.removeChild(widget);
                    if (this.hideForNDaysAfterDismiss > 0) {
                        localStorage.setItem(`survey_${this.surveyId}_dismissed`, new Date().toISOString());
                    }
                }

                if (event.data.type === 'surveyCompleted') {
                    localStorage.setItem(`survey_${this.surveyId}_completed`, new Date().toISOString());
                }

                if (event.data.type === 'surveyLoaded') {
                    widget.style.display = 'block';
                }
            });
            
            document.body.appendChild(widget);
        }
    }

    window.DorableSurveyWidget = DorableSurveyWidget;
}

if (typeof window.DorableBoardWidget === 'undefined') {
    class DorableBoardWidget {
        constructor(config) {
            this.subdomain = config.subdomain;
            this.env = config.env || 'prod';
            this.user_email = config.user_email || '';
            this.user_display_name = config.user_display_name || '';
            
            this.init();
        }

        init() {
            // Create wrapper for the overlay effect
            const wrapper = document.createElement('div');
            wrapper.style.position = 'fixed';
            wrapper.style.top = '0';
            wrapper.style.left = '0';
            wrapper.style.width = '100%';
            wrapper.style.height = '100%';
            wrapper.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            wrapper.style.zIndex = '9998';
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.justifyContent = 'center';

            const widget = document.createElement('iframe');
            widget.id = `dorable-board-widget-${Math.random().toString(36).substr(2, 9)}`;
            
            // Set the source URL based on environment and include user params
            const userParams = `user_email=${encodeURIComponent(this.user_email)}&user_display_name=${encodeURIComponent(this.user_display_name)}`;
            if(this.env != 'dev'){
                widget.src = `https://${this.subdomain}.dorable.ai/board-widget?${userParams}`;
            }else{
                widget.src = `http://localhost:5173/board-widget?subdomain=${this.subdomain}&${userParams}`;
            }
            
            // Widget styling for centered dialog
            widget.style.width = '100vw';
            widget.style.height = '100vh';
            widget.style.border = 'none';
            widget.style.zIndex = '9999';
            widget.style.boxShadow = '0px solid #fff';
            widget.style.borderRadius = '0px';
            widget.style.background = 'transparent';
            widget.style.backgroundColor = 'transparent';
                    
            // Prevent page scrolling
            document.body.style.overflow = 'hidden';
            
            // Message listener for close
            const messageHandler = (event) => {
                if (event.origin !== 'http://localhost:5173' && event.origin.indexOf('dorable.ai') == -1) return;
                
                if (event.data.type === 'closeWidget') {
                    document.body.removeChild(wrapper);
                    document.body.style.overflow = ''; // Restore scrolling
                    window.removeEventListener('message', messageHandler); // Remove the listener
                }
            };

            window.addEventListener('message', messageHandler);
            
            // Close on clicking outside
            wrapper.addEventListener('click', (event) => {
                if (event.target === wrapper) {
                    document.body.removeChild(wrapper);
                    document.body.style.overflow = ''; // Restore scrolling
                    window.removeEventListener('message', messageHandler); // Remove the listener
                }
            });

            wrapper.appendChild(widget);
            document.body.appendChild(wrapper);
        }
    }

    // Make it globally available
    window.DorableBoardWidget = DorableBoardWidget; 
}
