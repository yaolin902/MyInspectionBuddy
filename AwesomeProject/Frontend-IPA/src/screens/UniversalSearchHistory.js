import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Button,
    Alert
} from 'react-native';
import SearchHistoryService from './SearchHistoryService';
import { MaterialIcons } from '@expo/vector-icons';

const UniversalSearchHistory = ({ searchType, onSelectHistory }) => {
    const [searchHistory, setSearchHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        const history = await SearchHistoryService.getHistory(searchType);
        setSearchHistory(history);
    };

    const clearHistory = () => {
        Alert.alert(
            "Clear History",
            "Are you sure you want to clear all search history?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear",
                    onPress: async () => {
                        await SearchHistoryService.clearHistory(searchType);
                        setSearchHistory([]);
                    }
                }
            ]
        );
    };

    const getDisplayTitle = (item) => {
        switch (searchType) {
            case 'K510':
                return item.k510Number || item.applicantName || item.deviceName || 'Search';
            case 'FDA':
                return item.productDescription || item.recallingFirm || item.recallNumber || 'Search';
            case 'MAUDE':
                return item.deviceName || 'Search';
            case 'WARNING_LETTER':
                return item.firmName || 'Search';
            case 'OPEN_HISTORICAL':
                return item.keyword || 'Search';
            case 'CA_ENTITY':
                return item.searchTerm || 'Search';
            case 'CDPH':
                return item.deviceName || item.firmName || 'Search';
            default:
                return 'Search';
        }
    };

    const getDisplayDetails = (item) => {
        const formatDate = (date) => {
            try {
                return new Date(date).toLocaleDateString();
            } catch {
                return date;
            }
        };

        switch (searchType) {
            case 'K510':
                return [
                    item.k510Number && `510K: ${item.k510Number}`,
                    item.applicantName && `Applicant: ${item.applicantName}`,
                    item.deviceName && `Device: ${item.deviceName}`,
                    (item.fromDate && item.toDate) &&
                        `Date: ${formatDate(item.fromDate)} - ${formatDate(item.toDate)}`
                ].filter(Boolean).join('\n');

            case 'FDA':
                return [
                    item.productDescription && `Product: ${item.productDescription}`,
                    item.recallingFirm && `Firm: ${item.recallingFirm}`,
                    item.recallNumber && `Recall #: ${item.recallNumber}`,
                    item.recallClass && `Class: ${item.recallClass}`
                ].filter(Boolean).join('\n');

            case 'MAUDE':
                return [
                    item.deviceName && `Device: ${item.deviceName}`,
                    `Date: ${formatDate(item.fromDate)} - ${formatDate(item.toDate)}`
                ].filter(Boolean).join('\n');

            case 'WARNING_LETTER':
                return `Firm: ${item.firmName}`;

            case 'OPEN_HISTORICAL':
                return [
                    `Keyword: ${item.keyword}`,
                    item.year && `Year: ${item.year}`
                ].filter(Boolean).join('\n');

            case 'CA_ENTITY':
                return `Business Search: ${item.searchTerm}`;

            case 'CDPH':
                return [
                    item.deviceName && `Device: ${item.deviceName}`,
                    item.firmName && `Firm: ${item.firmName}`
                ].filter(Boolean).join('\n');

            default:
                return formatDate(item.timestamp);
        }
    };

    const renderHistoryItem = ({ item }) => {
        const title = getDisplayTitle(item);
        const details = getDisplayDetails(item);
        const searchDate = new Date(item.timestamp).toLocaleDateString();

        return (
            <TouchableOpacity
                style={styles.historyItem}
                onPress={() => {
                    onSelectHistory(item);
                    setShowHistory(false);
                }}
            >
                <View style={styles.historyItemHeader}>
                    <Text style={styles.historyItemTitle}>{title}</Text>
                    <Text style={styles.historyItemDate}>{searchDate}</Text>
                </View>
                <Text style={styles.historyItemDetails}>{details}</Text>
            </TouchableOpacity>
        );
    };

    if (!showHistory) {
        return (
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.showHistoryButton}
                    onPress={() => setShowHistory(true)}
                >
                    <MaterialIcons name="history" size={20} color="#007AFF" />
                    <Text style={styles.showHistoryButtonText}>Show History</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => setShowHistory(false)}
                >
                    <MaterialIcons name="keyboard-arrow-up" size={24} color="#007AFF" />
                    <Text style={styles.headerButtonText}>Hide History</Text>
                </TouchableOpacity>
                {searchHistory.length > 0 && (
                    <TouchableOpacity
                        style={[styles.headerButton, styles.clearButton]}
                        onPress={clearHistory}
                    >
                        <MaterialIcons name="delete-outline" size={20} color="#FF3B30" />
                        <Text style={styles.clearButtonText}>Clear</Text>
                    </TouchableOpacity>
                )}
            </View>

            {searchHistory.length > 0 ? (
                <FlatList
                    data={searchHistory}
                    renderItem={renderHistoryItem}
                    keyExtractor={item => item.id || item.timestamp}
                    style={styles.historyList}
                    contentContainerStyle={styles.historyListContent}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <MaterialIcons name="history" size={24} color="#666" />
                    <Text style={styles.emptyText}>No search history</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        maxHeight: 300,
        marginBottom: 15,
    },
    buttonContainer: {
        width: '100%',
        marginBottom: 10,
    },
    showHistoryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
    showHistoryButtonText: {
        color: '#007AFF',
        marginLeft: 8,
        fontSize: 16,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        paddingHorizontal: 4,
    },
    headerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
    headerButtonText: {
        color: '#007AFF',
        marginLeft: 4,
        fontSize: 16,
    },
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    clearButtonText: {
        color: '#FF3B30',
        marginLeft: 4,
        fontSize: 16,
    },
    historyList: {
        borderWidth: 1,
        borderColor: '#E5E5EA',
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
    },
    historyListContent: {
        paddingVertical: 4,
    },
    historyItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    historyItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    historyItemTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
        flex: 1,
    },
    historyItemDate: {
        fontSize: 12,
        color: '#8E8E93',
        marginLeft: 8,
    },
    historyItemDetails: {
        fontSize: 14,
        color: '#3C3C43',
        marginTop: 4,
        lineHeight: 20,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#F2F2F7',
        borderRadius: 8,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginTop: 8,
    }
});

export default UniversalSearchHistory;