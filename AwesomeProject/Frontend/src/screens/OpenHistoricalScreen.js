import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ScrollView,
    ActivityIndicator,
    Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import UniversalSearchHistory from './UniversalSearchHistory';
import SearchHistoryService from './SearchHistoryService';
import { BACKEND_URL } from '../../config.js';

const OpenHistoricalScreen = () => {
    const [keyword, setKeyword] = useState('');
    const [year, setYear] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const navigation = useNavigation();

    useEffect(() => {
        loadHistoricalSearches();
    }, []);

    const loadHistoricalSearches = async () => {
        try {
            const history = await SearchHistoryService.getHistory('OPEN_HISTORICAL');
            setSuggestions(history);
        } catch (error) {
            console.error('Error loading historical searches:', error);
        }
    };

    const handleKeywordChange = (text) => {
        setKeyword(text);
        setShowSuggestions(text.length > 0);
    };

    const handleSuggestionSelect = (historyItem) => {
        setKeyword(historyItem.keyword || '');
        setYear(historyItem.year || '');
        setShowSuggestions(false);
    };

    const renderSuggestions = () => {
        if (!showSuggestions || !keyword.trim()) return null;

        const filteredSuggestions = suggestions.filter(item => 
            item.keyword && 
            item.keyword.toLowerCase().includes(keyword.toLowerCase())
        );

        if (filteredSuggestions.length === 0) return null;

        return (
            <View style={styles.suggestionsContainer}>
                {filteredSuggestions.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.suggestionItem}
                        onPress={() => handleSuggestionSelect(item)}
                    >
                        <Text style={styles.suggestionPrimary}>{item.keyword}</Text>
                        <Text style={styles.suggestionSecondary}>
                            {item.year && `Year: ${item.year}`}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const handleHistorySelect = (historyItem) => {
        setKeyword(historyItem.keyword || '');
        setYear(historyItem.year || '');
    };

    const validateSearch = () => {
        if (!keyword.trim()) {
            Alert.alert('Validation Error', 'Please enter a keyword');
            return false;
        }
        if (year && !/^\d{4}$/.test(year)) {
            Alert.alert('Validation Error', 'Please enter a valid 4-digit year');
            return false;
        }
        return true;
    };

    const fetchData = async () => {
        if (!validateSearch()) return;

        setIsLoading(true);

        const searchParams = {
            keyword: keyword.trim(),
            year: year.trim()
        };

        try {
            await SearchHistoryService.saveSearch('OPEN_HISTORICAL', searchParams);
            await loadHistoricalSearches();

            const response = await fetch(`${BACKEND_URL}/openhistorical`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(searchParams),
            });

            const result = await response.json();

            if (result.error) {
                Alert.alert('Error', result.error);
            } else {
                if (result && result.length > 0) {
                    navigation.navigate('OpenHistoricalResultsScreen', { results: result });
                } else {
                    Alert.alert('No Results', 'No historical documents found for the provided criteria.');
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            Alert.alert('Error', 'Failed to fetch data from the server');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScrollView style={styles.scrollView}>
            <View style={styles.container}>
                <Text style={styles.title}>Open Historical Search</Text>

                <UniversalSearchHistory
                    searchType="OPEN_HISTORICAL"
                    onSelectHistory={handleHistorySelect}
                />

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Keyword: *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter keyword"
                        value={keyword}
                        onChangeText={handleKeywordChange}
                        onFocus={() => setShowSuggestions(true)}
                    />
                    {renderSuggestions()}

                    <Text style={styles.label}>Year:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter year (YYYY)"
                        value={year}
                        onChangeText={setYear}
                        onFocus={() => setShowSuggestions(false)}
                        keyboardType="numeric"
                        maxLength={4}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.searchButton, isLoading && styles.searchButtonDisabled]}
                    onPress={fetchData}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.searchButtonText}>Search</Text>
                    )}
                </TouchableOpacity>

                <Text style={styles.requiredField}>* Required field</Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        fontWeight: '500',
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#fff',
        fontSize: 16,
        marginBottom: 15,
    },
    searchButton: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    searchButtonDisabled: {
        backgroundColor: '#999',
    },
    searchButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    requiredField: {
        color: '#666',
        fontSize: 12,
        marginTop: 10,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    suggestionsContainer: {
        marginTop: -10,
        marginBottom: 15,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        maxHeight: 200,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    suggestionItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    suggestionPrimary: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '500',
        marginBottom: 4,
    },
    suggestionSecondary: {
        fontSize: 14,
        color: '#666',
        lineHeight: 18,
    }
});

export default OpenHistoricalScreen;