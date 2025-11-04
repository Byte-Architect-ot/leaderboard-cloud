        // Page Navigation
        function switchPage(pageName) {
            console.log('Switching to page:', pageName);
            const pages = document.querySelectorAll('.page');
            pages.forEach(page => page.classList.remove('active'));

            const targetPage = document.getElementById(pageName);
            if (targetPage) {
                targetPage.classList.add('active');

                // Special handling for leaderboard page
                if (pageName === 'leaderboard') {
                    console.log('Leaderboard page activated, ensuring visibility');
                    // Ensure leaderboard is visible
                    const leaderboard = targetPage.querySelector('.leaderboard');
                    if (leaderboard) {
                        leaderboard.style.opacity = '1';
                        leaderboard.style.transform = 'translateY(0)';
                        console.log('Leaderboard visibility ensured');
                    }

                    // Trigger intersection observer for leaderboard elements
                    const leaderboardElements = targetPage.querySelectorAll('.leaderboard, .stat-card, .achievement-card, .prize-card, .course-card');
                    leaderboardElements.forEach(el => {
                        el.style.opacity = '1';
                        el.style.transform = 'translateY(0)';
                    });

                    // If we have data, ensure leaderboard is updated
                    if (participantsData && participantsData.length > 0) {
                        console.log('Data available, updating leaderboard on page switch');
                        setTimeout(() => {
                            updateLeaderboard();
                            updateLeaderboardStats();
                        }, 100);
                    }
                }
            }

            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('data-page') === pageName) {
                    link.classList.add('active');
                }
            });

            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Create Particle Animation
        function createParticle() {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * window.innerWidth + 'px';
            particle.style.animationDuration = (Math.random() * 3 + 2) + 's';
            particle.style.animationDelay = Math.random() * 2 + 's';
            particle.style.animation = 'particle-float ' + (Math.random() * 5 + 5) + 's ease-in infinite';

            const colors = ['#3b82f6', '#0891b2', '#8b5cf6', '#06b6d4'];
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];

            document.body.appendChild(particle);

            setTimeout(() => {
                particle.remove();
            }, 10000);
        }

        setInterval(createParticle, 500);

        // Add 3D tilt effect to cards
        document.addEventListener('DOMContentLoaded', function() {
            const cards = document.querySelectorAll('.stat-card, .achievement-card, .prize-card');

            cards.forEach(card => {
                card.addEventListener('mousemove', (e) => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;

                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;

                    const rotateX = (y - centerY) / 10;
                    const rotateY = (centerX - x) / 10;

                    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px) scale(1.02)`;
                });

                card.addEventListener('mouseleave', () => {
                    card.style.transform = '';
                });
            });
        });

        // Scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Data Management
        let participantsData = [];
        let filteredData = [];
        let statsData = {};
        let currentSort = 'badges';
        let sortDirection = 'desc';
        let updateTimeout = null;

        // Function to read Excel file
        function readExcelFile(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();

                reader.onload = function(e) {
                    try {
                        const data = new Uint8Array(e.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });

                        // Get the first worksheet
                        const firstSheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[firstSheetName];

                        // Convert to JSON
                        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                        console.log('Excel data loaded:', jsonData);
                        resolve(jsonData);
                    } catch (error) {
                        reject(error);
                    }
                };

                reader.onerror = function() {
                    reject(new Error('Failed to read file'));
                };

                reader.readAsArrayBuffer(file);
            });
        }

        // Function to process Excel data and convert to our format
        function processExcelData(excelData) {
            if (!excelData || excelData.length < 2) {
                console.error('Invalid Excel data');
                return [];
            }

            const headers = excelData[0];
            console.log('Excel headers:', headers);

            const participants = [];

            // Start from second row (index 1) as requested
            for (let i = 1; i < excelData.length; i++) {
                const row = excelData[i];
                if (row.length === 0 || !row[0]) continue; // Skip empty rows

                const participant = {};

                // Map Excel columns to our format
                headers.forEach((header, index) => {
                    if (header && row[index] !== undefined) {
                        const cleanHeader = header.toString().trim().toLowerCase();

                        // Map common column names
                        if (cleanHeader.includes('name') || cleanHeader.includes('student')) {
                            participant.Name = row[index].toString().trim();
                        } else if (cleanHeader.includes('college') || cleanHeader.includes('institution')) {
                            participant.College = row[index].toString().trim();
                        } else if (cleanHeader.includes('badge') || cleanHeader.includes('skill')) {
                            participant.Badges = parseInt(row[index]) || 0;
                        } else if (cleanHeader.includes('progress') || cleanHeader.includes('completion')) {
                            participant.Progress = parseInt(row[index]) || 0;
                        } else if (cleanHeader.includes('streak') || cleanHeader.includes('day')) {
                            participant.Streak = parseInt(row[index]) || 0;
                        } else if (cleanHeader.includes('email')) {
                            participant.Email = row[index].toString().trim();
                        } else if (cleanHeader.includes('rank')) {
                            participant.Rank = parseInt(row[index]) || 0;
                        } else if (cleanHeader.includes('totalhours') || cleanHeader.includes('hours')) {
                            participant.TotalHours = parseFloat(row[index]) || 0;
                        } else if (cleanHeader.includes('modulescompleted') || cleanHeader.includes('modules')) {
                            participant.ModulesCompleted = parseInt(row[index]) || 0;
                        } else {
                            // Store other columns as-is
                            participant[header] = row[index];
                        }
                    }
                });

                // Ensure required fields have default values
                if (!participant.Name) participant.Name = `Participant ${i}`;
                if (!participant.College) participant.College = 'WCE Sangli';
                if (!participant.Badges) participant.Badges = 0;
                if (!participant.Progress) participant.Progress = 0;
                if (!participant.Streak) participant.Streak = 0;
                if (!participant.Rank) participant.Rank = i;

                participants.push(participant);
            }

            console.log('Processed participants:', participants);
            return participants;
        }

        // Function to load JSON data automatically
        async function loadExcelFileAutomatically() {
            try {
                console.log('Loading JSON data automatically...');

                // Try to fetch the processed JSON file first
                const response = await fetch('participants_data.json');
                if (!response.ok) {
                    throw new Error('JSON file not found, trying Excel...');
                }

                const jsonData = await response.json();
                console.log('JSON data loaded:', jsonData);
                console.log('JSON data length:', jsonData.length);

                // Use the JSON data directly
                participantsData = jsonData;
                filteredData = [...participantsData];

                console.log('Processed participants data:', participantsData);
                console.log('Processed participants count:', participantsData.length);

                // Calculate stats first
                calculateStats();
                console.log('Stats calculated:', statsData);

                // Update leaderboard
                console.log('Updating leaderboard...');
                updateLeaderboard();

                // Update stats cards
                console.log('Updating stats cards...');
                updateStatsCards();

                // Update leaderboard stats
                console.log('Updating leaderboard stats...');
                updateLeaderboardStats();

                console.log('JSON data loaded successfully:', participantsData);

            } catch (error) {
                console.error('Error loading JSON file:', error);
                console.log('Falling back to CSV data...');
                // Try CSV data as fallback
                await loadCSVDataFallback();
            }
        }

        // Function to load CSV data as fallback
        async function loadCSVDataFallback() {
            try {
                console.log('Trying to load processed CSV data...');
                const response = await fetch('participants_data_processed.csv');
                const csvText = await response.text();
                console.log('CSV text loaded:', csvText.substring(0, 200) + '...');

                participantsData = parseCSV(csvText);
                filteredData = [...participantsData];

                console.log('Parsed CSV data:', participantsData);
                console.log('Parsed CSV count:', participantsData.length);

                calculateStats();
                updateLeaderboard();
                updateStatsCards();
                updateLeaderboardStats();

                console.log('CSV data loaded successfully:', participantsData);
            } catch (error) {
                console.error('Error loading CSV data:', error);
                console.log('Falling back to original CSV...');
                try {
                    const response = await fetch('participants_data.csv');
                    const csvText = await response.text();
                    participantsData = parseCSV(csvText);
                    filteredData = [...participantsData];
                    calculateStats();
                    updateLeaderboard();
                    updateStatsCards();
                    updateLeaderboardStats();
                    console.log('Original CSV data loaded successfully');
                } catch (error2) {
                    console.error('Error loading original CSV:', error2);
                    loadSampleData();
                }
            }
        }

        // Function to load sample data as final fallback
        function loadSampleData() {
            console.log('Loading sample data...');
            participantsData = [
                {Name: 'Aarav Kulkarni', College: 'WCE Sangli', Badges: 20, Streak: 11, Progress: 100, Rank: 1},
                {Name: 'Diya Patil', College: 'WCE Sangli', Badges: 20, Streak: 14, Progress: 100, Rank: 2},
                {Name: 'Arjun Deshmukh', College: 'WCE Sangli', Badges: 19, Streak: 12, Progress: 95, Rank: 3},
                {Name: 'Isha Jadhav', College: 'WCE Sangli', Badges: 19, Streak: 9, Progress: 90, Rank: 4},
                {Name: 'Vihaan Kale', College: 'WCE Sangli', Badges: 18, Streak: 10, Progress: 90, Rank: 5},
                {Name: 'Priya Sharma', College: 'WCE Sangli', Badges: 18, Streak: 8, Progress: 85, Rank: 6},
                {Name: 'Rohan Patil', College: 'WCE Sangli', Badges: 17, Streak: 7, Progress: 80, Rank: 7},
                {Name: 'Ananya Singh', College: 'WCE Sangli', Badges: 17, Streak: 6, Progress: 80, Rank: 8},
                {Name: 'Karthik Reddy', College: 'WCE Sangli', Badges: 16, Streak: 5, Progress: 75, Rank: 9},
                {Name: 'Sneha Joshi', College: 'WCE Sangli', Badges: 16, Streak: 4, Progress: 75, Rank: 10}
            ];
            filteredData = [...participantsData];
            calculateStats();
            updateLeaderboard();
            updateStatsCards();
            updateLeaderboardStats();
            console.log('Sample data loaded successfully');
        }

        // Function to parse CSV data
        function parseCSV(csvText) {
            const lines = csvText.split('\n');
            const headers = lines[0].split(',');
            const data = [];

            // Start from second row (index 1) as requested
            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim()) {
                    const values = lines[i].split(',');
                    const row = {};
                    headers.forEach((header, index) => {
                        const cleanHeader = header.trim();
                        const value = values[index] ? values[index].trim() : '';

                        // Convert numeric fields appropriately
                        if (cleanHeader === 'Badges' || cleanHeader === 'Streak' || cleanHeader === 'Progress' || cleanHeader === 'Rank' || cleanHeader === 'ModulesCompleted') {
                            row[cleanHeader] = parseInt(value) || 0;
                        } else if (cleanHeader === 'TotalHours') {
                            row[cleanHeader] = parseFloat(value) || 0;
                        } else {
                            row[cleanHeader] = value;
                        }
                    });
                    data.push(row);
                }
            }
            return data;
        }

        // Function to calculate statistics from CSV data
        function calculateStats() {
            if (participantsData.length === 0) return;

            const totalParticipants = participantsData.length;
            const totalBadges = participantsData.reduce((sum, participant) => sum + parseInt(participant.Badges || 0), 0);
            const avgProgress = participantsData.reduce((sum, participant) => sum + parseInt(participant.Progress || 0), 0) / totalParticipants;
            const activeToday = Math.floor(totalParticipants * 0.75); // Estimate 75% active
            const completionRate = Math.floor(avgProgress);

            // Calculate average time per badge from TotalHours if available
            const totalHours = participantsData.reduce((sum, participant) => sum + parseFloat(participant.TotalHours || 0), 0);
            const avgTimePerBadge = totalBadges > 0 ? (totalHours / totalBadges).toFixed(1) + 'h' : '2.3h';

            statsData = {
                totalParticipants,
                activeToday,
                totalBadges,
                avgProgress: Math.round(avgProgress),
                avgTimePerBadge,
                completionRate,
                totalHours: Math.round(totalHours)
            };
        }

        // Function to sort data with badge priority
        function sortData(data, sortBy, direction) {
            return data.sort((a, b) => {
                let aVal, bVal;

                switch(sortBy) {
                    case 'badges':
                        aVal = parseInt(a.Badges || 0);
                        bVal = parseInt(b.Badges || 0);
                        // If badges are equal, sort by progress
                        if (aVal === bVal) {
                            const aProgress = parseInt(a.Progress || 0);
                            const bProgress = parseInt(b.Progress || 0);
                            return direction === 'asc' ? aProgress - bProgress : bProgress - aProgress;
                        }
                        break;
                    case 'progress':
                        aVal = parseInt(a.Progress || 0);
                        bVal = parseInt(b.Progress || 0);
                        // If progress is equal, sort by badges
                        if (aVal === bVal) {
                            const aBadges = parseInt(a.Badges || 0);
                            const bBadges = parseInt(b.Badges || 0);
                            return direction === 'asc' ? aBadges - bBadges : bBadges - aBadges;
                        }
                        break;
                    case 'streak':
                        aVal = parseInt(a.Streak || 0);
                        bVal = parseInt(b.Streak || 0);
                        // If streak is equal, sort by badges
                        if (aVal === bVal) {
                            const aBadges = parseInt(a.Badges || 0);
                            const bBadges = parseInt(b.Badges || 0);
                            return direction === 'asc' ? aBadges - bBadges : bBadges - aBadges;
                        }
                        break;
                    case 'name':
                        aVal = (a.Name || '').toLowerCase();
                        bVal = (b.Name || '').toLowerCase();
                        break;
                    case 'college':
                        aVal = (a.College || '').toLowerCase();
                        bVal = (b.College || '').toLowerCase();
                        break;
                    default:
                        // Default sorting: badges first, then progress
                        aVal = parseInt(a.Badges || 0);
                        bVal = parseInt(b.Badges || 0);
                        if (aVal === bVal) {
                            const aProgress = parseInt(a.Progress || 0);
                            const bProgress = parseInt(b.Progress || 0);
                            return bProgress - aProgress;
                        }
                }

                if (direction === 'asc') {
                    return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
                } else {
                    return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
                }
            });
        }

        // Debounced update function to prevent rapid updates
        function debouncedUpdateLeaderboard() {
            if (updateTimeout) {
                clearTimeout(updateTimeout);
            }
            updateTimeout = setTimeout(() => {
                console.log('Executing debounced leaderboard update');
                updateLeaderboard();
            }, 100);
        }

        // Function to filter data based on search
        function filterData(searchTerm) {
            console.log('Filtering data with search term:', searchTerm);
            console.log('Participants data available:', participantsData ? participantsData.length : 'undefined');

            if (!participantsData || participantsData.length === 0) {
                console.warn('No participants data available for filtering');
                return;
            }

            if (!searchTerm) {
                filteredData = [...participantsData];
                console.log('Reset to all participants:', filteredData.length);
            } else {
                filteredData = participantsData.filter(participant =>
                    participant.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    participant.College.toLowerCase().includes(searchTerm.toLowerCase())
                );
                console.log('Filtered to:', filteredData.length, 'participants');
            }
            debouncedUpdateLeaderboard();
        }

        // Function to update leaderboard with CSV data
        function updateLeaderboard() {
            try {
                console.log('Updating leaderboard with data:', filteredData);
                console.log('Filtered data length:', filteredData ? filteredData.length : 'undefined');

                const tbody = document.getElementById('leaderboardBody');
                if (!tbody) {
                    console.error('Leaderboard body not found!');
                    return;
                }

                // Don't clear the leaderboard if we don't have data yet
                if (!filteredData || filteredData.length === 0) {
                    console.log('No filtered data available, keeping existing content');
                    return;
                }

                console.log('Processing', filteredData.length, 'participants for leaderboard');

                tbody.innerHTML = '';

                // Sort the filtered data by badges first (default ranking)
                const sortedData = sortData([...filteredData], currentSort, sortDirection);

                // Calculate sequential rankings from 1 to last entry
                sortedData.forEach((participant, index) => {
                    const row = document.createElement('tr');
                    row.style.animationDelay = `${index * 0.05}s`;

                    const badges = parseInt(participant.Badges || 0);
                    const progress = parseInt(participant.Progress || 0);
                    const isCompleted = badges >= 20 && progress >= 100;

                    // Use sequential ranking: index + 1 (1, 2, 3, ..., n)
                    const currentRank = index + 1;

                    // Determine rank display and styling
                    let rankDisplay, rankClass;
                    if (badges >= 20 && progress >= 100) {
                        // Top tier: Completed all badges
                        if (currentRank <= 3) {
                            rankDisplay = ['🥇', '🥈', '🥉'][currentRank - 1];
                            rankClass = 'rank-medal';
                        } else {
                            rankDisplay = `#${currentRank}`;
                            rankClass = 'rank-number';
                        }
                    } else if (badges >= 15) {
                        // High tier: 15+ badges
                        rankDisplay = `#${currentRank}`;
                        rankClass = 'rank-number';
                    } else if (badges >= 10) {
                        // Medium tier: 10+ badges
                        rankDisplay = `#${currentRank}`;
                        rankClass = 'rank-number';
                    } else {
                        // Lower tier: <10 badges
                        rankDisplay = `#${currentRank}`;
                        rankClass = 'rank-number';
                    }

                    // Badge completion percentage
                    const badgePercentage = Math.round((badges / 20) * 100);

                    row.innerHTML = `
                        <td data-label="Rank: "><span class="${rankClass}">${rankDisplay}</span></td>
                        <td data-label="Name: "><span class="name">${participant.Name}</span></td>
                        `;

                    tbody.appendChild(row);
                });

                console.log('Leaderboard updated successfully with', sortedData.length, 'rows');
            } catch (error) {
                console.error('Error updating leaderboard:', error);
                const tbody = document.getElementById('leaderboardBody');
                if (tbody) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="6" style="text-align: center; padding: 40px; color: #ef4444;">
                                <div style="font-size: 18px; margin-bottom: 10px;">⚠️</div>
                                Error loading leaderboard data. Please refresh the page.
                            </td>
                        </tr>
                    `;
                }
            }
        }

        // Function to update leaderboard statistics
        function updateLeaderboardStats() {
            try {
                if (!participantsData || participantsData.length === 0) {
                    console.log('No participants data available for stats');
                    return;
                }

                console.log('Updating leaderboard stats with', participantsData.length, 'participants');

                const completedCount = participantsData.filter(p => parseInt(p.Badges || 0) >= 20 && parseInt(p.Progress || 0) >= 100).length;
                const highPerformers = participantsData.filter(p => parseInt(p.Badges || 0) >= 15).length;
                const avgBadges = Math.round(participantsData.reduce((sum, p) => sum + parseInt(p.Badges || 0), 0) / participantsData.length);
                const totalHours = participantsData.reduce((sum, p) => sum + parseFloat(p.TotalHours || 0), 0);

                console.log('Stats calculated:', { completedCount, highPerformers, avgBadges, totalHours });

                // Update the leaderboard stats display
                const totalParticipantsEl = document.getElementById('totalParticipants');
                const completedParticipantsEl = document.getElementById('completedParticipants');
                const avgProgressEl = document.getElementById('avgProgress');
                const totalBadgesEl = document.getElementById('totalBadges');

                if (totalParticipantsEl) {
                    totalParticipantsEl.textContent = participantsData.length;
                    console.log('Updated total participants:', participantsData.length);
                } else {
                    console.warn('totalParticipants element not found');
                }

                // if (completedParticipantsEl) {
                //     completedParticipantsEl.textContent = completedCount;
                //     console.log('Updated completed participants:', completedCount);
                // } else {
                //     console.warn('completedParticipants element not found');
                // }

                if (avgProgressEl) {
                    avgProgressEl.textContent = avgBadges + ' badges';
                    console.log('Updated avg progress:', avgBadges + ' badges');
                } else {
                    console.warn('avgProgress element not found');
                }

                if (totalBadgesEl) {
                    totalBadgesEl.textContent = Math.round(totalHours) + ' hrs';
                    console.log('Updated total badges:', Math.round(totalHours) + ' hrs');
                } else {
                    console.warn('totalBadges element not found');
                }
            } catch (error) {
                console.error('Error updating leaderboard stats:', error);
            }
        }

        // Global functions for HTML onclick events
        function sortTable(sortBy) {
            if (currentSort === sortBy) {
                sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort = sortBy;
                sortDirection = 'desc';
            }
            updateLeaderboard();
        }

        // Function to update statistics cards with CSV data
        function updateStatsCards() {
            if (!statsData || Object.keys(statsData).length === 0) return;

            const statCards = document.querySelectorAll('.stat-card');
            const statValues = [
                statsData.totalParticipants,
                statsData.activeToday,
                statsData.totalBadges,
                statsData.avgProgress + '%',
                statsData.avgTimePerBadge,
                statsData.completionRate + '%'
            ];

            // statCards.forEach((card, index) => {
            //     const valueElement = card.querySelector('.stat-value');
            //     if (valueElement && statValues[index]) {
            //         valueElement.textContent = statValues[index];
            //     }
            // });
        }

        window.addEventListener('DOMContentLoaded', () => {
            console.log('DOM Content Loaded');
            switchPage('home');

            // Add event listeners for leaderboard controls
            const sortSelect = document.getElementById('sortBy');
            const searchInput = document.getElementById('searchInput');

            if (sortSelect) {
                sortSelect.addEventListener('change', (e) => {
                    currentSort = e.target.value;
                    sortDirection = 'desc';
                    updateLeaderboard();
                });
            }

            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    console.log('Search input changed:', e.target.value);
                    // Only filter if we have data loaded
                    if (participantsData && participantsData.length > 0) {
                        filterData(e.target.value);
                    } else {
                        console.log('Data not loaded yet, skipping filter');
                    }
                });
            }

            const animatedElements = document.querySelectorAll('.stat-card, .achievement-card, .prize-card, .course-card, .leaderboard');
            animatedElements.forEach(el => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(30px)';
                el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
                observer.observe(el);
            });

            // Special handling for leaderboard - ensure it's visible when data is loaded
            const leaderboardElement = document.querySelector('.leaderboard');
            if (leaderboardElement) {
                // Add a custom event listener for when data is loaded
                const originalUpdateLeaderboard = updateLeaderboard;
                updateLeaderboard = function() {
                    originalUpdateLeaderboard();
                    // Ensure leaderboard is visible after update
                    setTimeout(() => {
                        leaderboardElement.style.opacity = '1';
                        leaderboardElement.style.transform = 'translateY(0)';
                        console.log('Leaderboard visibility forced after update');
                    }, 50);
                };
            }

            // Load data after a short delay to ensure DOM is fully ready
            setTimeout(() => {
                console.log('Starting data load...');
                loadExcelFileAutomatically();
            }, 100);
        });

                        // <td data-label="College: "><span class="college">${participant.College}</span></td>
                        // <td data-label="Badges: ">
                        //     <div style="display: flex; align-items: center; gap: 8px;">
                        //         <span class="badge-tag ${isCompleted ? 'completed' : ''}" style="background: ${isCompleted ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--card-bg)'}; color: ${isCompleted ? 'white' : 'var(--text)'};">
                        //             ⭐ ${participant.Badges}/20
                        //         </span>
                        //         <div style="font-size: 12px; color: var(--text-muted);">${badgePercentage}%</div>
                        //     </div>
                        // </td>
