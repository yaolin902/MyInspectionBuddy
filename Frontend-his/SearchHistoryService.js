import AsyncStorage from '@react-native-async-storage/async-storage';

class SearchHistoryService {
    constructor() {
        this.HISTORY_KEYS = {
            K510: '@search_history_k510',
            FDA: '@search_history_fda',
            MAUDE: '@search_history_maude',
            WARNING_LETTER: '@search_history_warning_letter',
            OPEN_HISTORICAL: '@search_history_open_historical',
            CA_ENTITY: '@search_history_ca_entity',
            CDPH: '@search_history_cdph'
        };

        this.MAX_HISTORY_ITEMS = 10;
        this.EXPIRY_DAYS = 30; // History items expire after 30 days
    }

    /**
     * Gets formatted display values for history items
     */
    getHistoryDisplayValue(searchType, item) {
        const formatDate = (date) => {
            if (!date) return '';
            try {
                return new Date(date).toLocaleDateString();
            } catch {
                return date;
            }
        };

        switch (searchType) {
            case 'K510': {
                const title = item.k510Number || item.applicantName || item.deviceName;
                const details = [
                    item.k510Number && `510K: ${item.k510Number}`,
                    item.applicantName && `Applicant: ${item.applicantName}`,
                    item.deviceName && `Device: ${item.deviceName}`,
                    (item.fromDate && item.toDate) &&
                        `Date: ${formatDate(item.fromDate)} to ${formatDate(item.toDate)}`
                ].filter(Boolean).join('\n');

                return { title, details };
            }

            case 'FDA': {
                const title = item.productDescription || item.recallingFirm || item.recallNumber;
                const details = [
                    item.productDescription && `Product: ${item.productDescription}`,
                    item.recallingFirm && `Firm: ${item.recallingFirm}`,
                    item.recallNumber && `Recall #: ${item.recallNumber}`,
                    item.recallClass && `Class: ${item.recallClass}`,
                    (item.fromDate && item.toDate) &&
                        `Date: ${formatDate(item.fromDate)} to ${formatDate(item.toDate)}`
                ].filter(Boolean).join('\n');

                return { title, details };
            }

            case 'MAUDE': {
                const title = item.deviceName;
                const details = [
                    item.deviceName && `Device: ${item.deviceName}`,
                    (item.fromDate && item.toDate) &&
                        `Date: ${formatDate(item.fromDate)} to ${formatDate(item.toDate)}`
                ].filter(Boolean).join('\n');

                return { title, details };
            }

            case 'WARNING_LETTER': {
                const title = item.firmName;
                const details = `Last Searched: ${formatDate(item.timestamp)}`;

                return { title, details };
            }

            case 'OPEN_HISTORICAL': {
                const title = item.keyword;
                const details = [
                    item.keyword && `Keyword: ${item.keyword}`,
                    item.year && `Year: ${item.year}`
                ].filter(Boolean).join('\n');

                return { title, details };
            }

            case 'CA_ENTITY': {
                const title = item.searchTerm;
                const details = `Business Search: ${item.searchTerm}`;

                return { title, details };
            }

            case 'CDPH': {
                const title = item.deviceName || item.firmName;
                const details = [
                    item.deviceName && `Device: ${item.deviceName}`,
                    item.firmName && `Firm: ${item.firmName}`
                ].filter(Boolean).join('\n');

                return { title, details };
            }

            default: {
                const firstValue = Object.values(item)
                    .find(value => typeof value === 'string' && value.trim() !== '');
                return {
                    title: firstValue || 'Search',
                    details: `Date: ${formatDate(item.timestamp)}`
                };
            }
        }
    }

    /**
     * Check if a history item is expired
     */
    isExpired(timestamp) {
        const now = new Date();
        const itemDate = new Date(timestamp);
        const diffDays = (now - itemDate) / (1000 * 60 * 60 * 24);
        return diffDays > this.EXPIRY_DAYS;
    }

    /**
     * Format search parameters before saving
     */
    formatSearchParams(searchType, params) {
        const baseParams = {
            timestamp: new Date().toISOString(),
            id: new Date().getTime().toString()
        };

        // Remove empty values
        const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                acc[key] = value;
            }
            return acc;
        }, {});

        return { ...baseParams, ...cleanParams };
    }

    /**
     * Get history for a specific search type
     */
    async getHistory(searchType) {
        try {
            const historyKey = this.HISTORY_KEYS[searchType];
            if (!historyKey) {
                console.error(`Invalid search type: ${searchType}`);
                return [];
            }

            const history = await AsyncStorage.getItem(historyKey);
            if (!history) return [];

            const parsedHistory = JSON.parse(history);

            // Filter out expired items
            const validHistory = parsedHistory.filter(item => !this.isExpired(item.timestamp));

            // Update storage if items were filtered out
            if (validHistory.length !== parsedHistory.length) {
                await AsyncStorage.setItem(historyKey, JSON.stringify(validHistory));
            }

            return validHistory;
        } catch (error) {
            console.error(`Error loading ${searchType} history:`, error);
            return [];
        }
    }

    /**
     * Save a new search to history
     */
    async saveSearch(searchType, searchParams) {
        try {
            const historyKey = this.HISTORY_KEYS[searchType];
            if (!historyKey) {
                throw new Error(`Invalid search type: ${searchType}`);
            }

            const existingHistory = await this.getHistory(searchType);
            const formattedParams = this.formatSearchParams(searchType, searchParams);

            // Add to beginning of array and limit size
            const updatedHistory = [formattedParams, ...existingHistory]
                .slice(0, this.MAX_HISTORY_ITEMS);

            await AsyncStorage.setItem(historyKey, JSON.stringify(updatedHistory));
            return updatedHistory;
        } catch (error) {
            console.error(`Error saving ${searchType} history:`, error);
            throw error;
        }
    }

    /**
     * Clear history for a specific search type
     */
    async clearHistory(searchType) {
        try {
            const historyKey = this.HISTORY_KEYS[searchType];
            if (!historyKey) {
                throw new Error(`Invalid search type: ${searchType}`);
            }
            await AsyncStorage.removeItem(historyKey);
        } catch (error) {
            console.error(`Error clearing ${searchType} history:`, error);
            throw error;
        }
    }

    /**
     * Clear all search history
     */
    async clearAllHistory() {
        try {
            const promises = Object.values(this.HISTORY_KEYS).map(key =>
                AsyncStorage.removeItem(key)
            );
            await Promise.all(promises);
        } catch (error) {
            console.error('Error clearing all history:', error);
            throw error;
        }
    }

    /**
     * Export all history data
     */
    async exportHistory(searchType = null) {
        try {
            if (searchType) {
                const history = await this.getHistory(searchType);
                return { [searchType]: history };
            }

            const allHistory = {};
            for (const type of Object.keys(this.HISTORY_KEYS)) {
                allHistory[type] = await this.getHistory(type);
            }
            return allHistory;
        } catch (error) {
            console.error('Error exporting history:', error);
            throw error;
        }
    }

    /**
     * Import history data
     */
    async importHistory(historyData) {
        try {
            const promises = Object.entries(historyData).map(([type, data]) => {
                if (this.HISTORY_KEYS[type]) {
                    return AsyncStorage.setItem(
                        this.HISTORY_KEYS[type],
                        JSON.stringify(data)
                    );
                }
                return Promise.resolve();
            });
            await Promise.all(promises);
        } catch (error) {
            console.error('Error importing history:', error);
            throw error;
        }
    }

    /**
     * Get the count of history items for a search type
     */
    async getHistoryCount(searchType) {
        const history = await this.getHistory(searchType);
        return history.length;
    }

    /**
     * Check if a search type is valid
     */
    isValidSearchType(searchType) {
        return searchType in this.HISTORY_KEYS;
    }
}

export default new SearchHistoryService();