document.addEventListener('DOMContentLoaded', () => {
    // Configuration
    const workingHours = {
        start: 9, // 9 AM
        end: 17   // 5 PM
    };
    
    // State
    const state = {
        currentDate: new Date(),
        bookedSlots: loadBookedSlots(),
        selectedSlot: null,
        today: new Date() // Store today's date for comparison
    };

    // Set hours to 0 for date comparison
    state.today.setHours(0, 0, 0, 0);
    
    // DOM Elements
    const currentDateEl = document.getElementById('current-date');
    const prevDayBtn = document.getElementById('prev-day');
    const nextDayBtn = document.getElementById('next-day');
    const slotsContainer = document.querySelector('.slots-container');
    const modal = document.getElementById('booking-modal');
    const bookingTimeEl = document.getElementById('booking-time');
    const confirmBookingBtn = document.getElementById('confirm-booking');
    const cancelBookingBtn = document.getElementById('cancel-booking');
    const closeModalBtn = document.querySelector('.close-modal');
    const availableSlotsEl = document.getElementById('available-slots');
    
    // Initialize
    updateDateDisplay();
    generateTimeSlots();
    updateNavigationButtons();

    // Handle cache clearing (Ctrl+Shift+R)
    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'r') {
            clearBookingData();
        }
    });
    
    // Event Listeners
    prevDayBtn.addEventListener('click', () => changeDate(-1));
    nextDayBtn.addEventListener('click', () => changeDate(1));
    confirmBookingBtn.addEventListener('click', confirmBooking);
    cancelBookingBtn.addEventListener('click', closeModal);
    closeModalBtn.addEventListener('click', closeModal);
    
    // Functions
    function updateDateDisplay() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateEl.textContent = state.currentDate.toLocaleDateString('en-US', options);
    }

    function updateNavigationButtons() {
        const currentDate = new Date(state.currentDate);
        currentDate.setHours(0, 0, 0, 0);

        // Disable previous button if current date is today
        prevDayBtn.disabled = currentDate.getTime() <= state.today.getTime();
        prevDayBtn.style.opacity = prevDayBtn.disabled ? '0.5' : '1';
        prevDayBtn.style.cursor = prevDayBtn.disabled ? 'not-allowed' : 'pointer';

        // Update next button (optional: limit to e.g., 30 days in advance)
        const maxDate = new Date(state.today);
        maxDate.setDate(maxDate.getDate() + 30); // Allow booking up to 30 days in advance
        nextDayBtn.disabled = currentDate.getTime() >= maxDate.getTime();
        nextDayBtn.style.opacity = nextDayBtn.disabled ? '0.5' : '1';
        nextDayBtn.style.cursor = nextDayBtn.disabled ? 'not-allowed' : 'pointer';
    }
    
    function changeDate(days) {
        const newDate = new Date(state.currentDate);
        newDate.setDate(newDate.getDate() + days);
        
        // Prevent going before today
        if (newDate.getTime() < state.today.getTime()) {
            return;
        }
        
        state.currentDate = newDate;
        updateDateDisplay();
        updateNavigationButtons();
        generateTimeSlots();
    }

    function isSlotAvailable(hour, minute) {
        // Check if the slot is in the past for today
        if (isSameDay(state.currentDate, new Date())) {
            const now = new Date();
            const slotTime = new Date(state.currentDate);
            slotTime.setHours(hour, minute, 0, 0);
            
            // If slot time is in the past, it's not available
            if (slotTime <= now) {
                return false;
            }
        }
        return true;
    }

    function isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }
    
    function generateTimeSlots() {
        slotsContainer.innerHTML = '';
        
        const dateKey = getDateKey(state.currentDate);
        const bookedSlotsForDate = state.bookedSlots[dateKey] || [];
        const currentTime = new Date();
        let availableSlotCount = 0;
        
        // Generate 30-minute slots from start to end time
        for (let hour = workingHours.start; hour < workingHours.end; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const slotTime = formatTime(hour, minute);
                const slotKey = `${hour}:${minute}`;
                const isBooked = bookedSlotsForDate.includes(slotKey);
                const isAvailable = isSlotAvailable(hour, minute);
                
                if (!isBooked && isAvailable) {
                    availableSlotCount++;
                }
                
                const slotEl = createSlotElement(slotTime, isBooked || !isAvailable, slotKey, !isAvailable);
                slotsContainer.appendChild(slotEl);
                
                // Add animation delay for staggered appearance
                const delay = ((hour - workingHours.start) * 2 + (minute === 30 ? 1 : 0)) * 0.05;
                slotEl.style.animationDelay = `${delay}s`;
            }
        }

        updateAvailableSlotCount(availableSlotCount);
    }

    function updateAvailableSlotCount(count) {
        availableSlotsEl.textContent = `${count} slot${count !== 1 ? 's' : ''} available`;
    }
    
    function createSlotElement(time, isBooked, slotKey, isPast) {
        const slot = document.createElement('div');
        slot.className = `slot ${isBooked ? 'booked' : 'available'} animate-in`;
        
        const timeEl = document.createElement('div');
        timeEl.className = 'slot-time';
        timeEl.textContent = time;
        
        const statusEl = document.createElement('div');
        statusEl.className = 'slot-status';
        statusEl.textContent = isPast ? 'Past' : (isBooked ? 'Booked' : 'Available');
        
        const iconEl = document.createElement('div');
        iconEl.className = 'slot-icon';
        iconEl.innerHTML = isBooked ? 
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M18 7l-1.41-1.41-6.34 6.34-2.83-2.83L6 10.5l4.25 4.25L18 7z"/></svg>' : 
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M17 12h-5v5h-1v-5H6v-1h5V6h1v5h5v1z"/></svg>';
        
        slot.appendChild(timeEl);
        slot.appendChild(statusEl);
        slot.appendChild(iconEl);
        
        if (!isBooked && !isPast) {
            slot.addEventListener('click', () => openBookingModal(time, slotKey));
        }
        
        if (isPast) {
            slot.style.opacity = '0.5';
            slot.style.cursor = 'not-allowed';
        }
        
        return slot;
    }
    
    function formatTime(hour, minute) {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 === 0 ? 12 : hour % 12;
        const displayMinute = minute.toString().padStart(2, '0');
        return `${displayHour}:${displayMinute} ${period}`;
    }
    
    function getDateKey(date) {
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    }
    
    function openBookingModal(time, slotKey) {
        state.selectedSlot = slotKey;
        bookingTimeEl.textContent = `${time} on ${currentDateEl.textContent}`;
        modal.style.display = 'flex';
        
        // Animate modal opening
        setTimeout(() => {
            modal.classList.add('modal-open');
        }, 10);
    }
    
    function closeModal() {
        modal.classList.remove('modal-open');
        setTimeout(() => {
            modal.style.display = 'none';
            state.selectedSlot = null;
        }, 300);
    }
    
    function confirmBooking() {
        if (!state.selectedSlot) return;
        
        const dateKey = getDateKey(state.currentDate);
        
        if (!state.bookedSlots[dateKey]) {
            state.bookedSlots[dateKey] = [];
        }
        
        state.bookedSlots[dateKey].push(state.selectedSlot);
        
        // Save to local storage
        saveBookedSlots();
        
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.textContent = `Appointment booked for ${bookingTimeEl.textContent}`;
        successMessage.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: var(--success-color);
            color: white;
            padding: 12px 20px;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow);
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease, transform 0.3s ease;
        `;
        
        document.body.appendChild(successMessage);
        
        // Animate success message
        setTimeout(() => {
            successMessage.style.opacity = '1';
            successMessage.style.transform = 'translateX(-50%) translateY(-10px)';
        }, 10);
        
        setTimeout(() => {
            successMessage.style.opacity = '0';
            successMessage.style.transform = 'translateX(-50%) translateY(10px)';
            setTimeout(() => {
                successMessage.remove();
            }, 300);
        }, 3000);
        
        closeModal();
        generateTimeSlots();
    }
    
    // Handle clicks outside the modal
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });
    
    // Local Storage Functions
    function loadBookedSlots() {
        const storedSlots = localStorage.getItem('appointmentBookings');
        return storedSlots ? JSON.parse(storedSlots) : {};
    }
    
    function saveBookedSlots() {
        localStorage.setItem('appointmentBookings', JSON.stringify(state.bookedSlots));
    }

    function clearBookingData() {
        localStorage.removeItem('appointmentBookings');
        state.bookedSlots = {};
        generateTimeSlots();
    }
}); 