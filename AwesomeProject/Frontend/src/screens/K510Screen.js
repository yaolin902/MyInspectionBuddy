import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    Button,
    ScrollView,
    ActivityIndicator,
    Alert,
    Platform,
    TouchableOpacity,
    FlatList
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import UniversalSearchHistory from './UniversalSearchHistory';
import SearchHistoryService from './SearchHistoryService';
import { BACKEND_URL } from '../../config.js';

const K510Screen = () => {
    const [k510Number, setK510Number] = useState('');
    const [applicantName, setApplicantName] = useState('');
    const [deviceName, setDeviceName] = useState('');
    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date());
    const [showFromDatePicker, setShowFromDatePicker] = useState(false);
    const [showToDatePicker, setShowToDatePicker] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const navigation = useNavigation();

    useEffect(() => {
        loadHistoricalSearches();
    }, []);

    const loadHistoricalSearches = async () => {
        try {
            const history = await SearchHistoryService.getHistory('K510');
            // Store complete history items in suggestions
            setSuggestions(history);
        } catch (error) {
            console.error('Error loading historical searches:', error);
        }
    };

    const handleK510NumberChange = (text) => {
        setK510Number(text);
        setShowSuggestions(text.length > 0);
    };

    const handleSuggestionSelect = (historyItem) => {
        // Use the complete history item to set all fields
        setK510Number(historyItem.k510Number || '');
        setApplicantName(historyItem.applicantName || '');
        setDeviceName(historyItem.deviceName || '');

        // Handle dates
        if (historyItem.fromDate) {
            const parsedFromDate = new Date(historyItem.fromDate);
            if (!isNaN(parsedFromDate.getTime())) {
                setFromDate(parsedFromDate);
            }
        }

        if (historyItem.toDate) {
            const parsedToDate = new Date(historyItem.toDate);
            if (!isNaN(parsedToDate.getTime())) {
                setToDate(parsedToDate);
            }
        }

        setShowSuggestions(false);
    };


    const renderSuggestions = () => {
        if (!showSuggestions || !k510Number.trim()) return null;

        const filteredSuggestions = suggestions.filter(suggestion =>
            suggestion.k510Number.toLowerCase().includes(k510Number.toLowerCase())
        );

        if (filteredSuggestions.length === 0) return null;

        return (
            <View style={styles.suggestionsContainer}>
                {filteredSuggestions.map((suggestion, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.suggestionItem}
                        onPress={() => handleSuggestionSelect(suggestion)}
                    >
                        <Text style={styles.suggestionText}>
                            <Text style={styles.suggestionValue}>{suggestion.k510Number}</Text>
                            {suggestion.deviceName ?
                                `\n${suggestion.deviceName}` : ''}
                            {suggestion.applicantName ?
                                `\n${suggestion.applicantName}` : ''}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const handleHistorySelect = (historyItem) => {
        setK510Number(historyItem.k510Number || '');
        setApplicantName(historyItem.applicantName || '');
        setDeviceName(historyItem.deviceName || '');
        if (historyItem.fromDate) {
            setFromDate(new Date(historyItem.fromDate));
        }
        if (historyItem.toDate) {
            setToDate(new Date(historyItem.toDate));
        }
    };

    const onChangeFrom = (event, selectedDate) => {
        const currentDate = selectedDate || fromDate;
        setShowFromDatePicker(Platform.OS === 'ios');
        setFromDate(currentDate);
    };

    const onChangeTo = (event, selectedDate) => {
        const currentDate = selectedDate || toDate;
        setShowToDatePicker(Platform.OS === 'ios');
        setToDate(currentDate);
    };

    const handleSearch = async () => {
        if (!k510Number && !applicantName && !deviceName) {
            Alert.alert('Error', 'Please enter at least one search criterion');
            return;
        }

        setIsLoading(true);
        setError('');
        setShowSuggestions(false);

        const searchParams = {
            k510Number: k510Number.trim(),
            applicantName: applicantName.trim(),
            deviceName: deviceName.trim(),
            fromDate: fromDate.toISOString().split('T')[0],
            toDate: toDate.toISOString().split('T')[0],
        };

        try {
            await SearchHistoryService.saveSearch('K510', searchParams);
            await loadHistoricalSearches(); // Reload suggestions after new search

            const response = await fetch(`${BACKEND_URL}/k510`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(searchParams),
            });

            const data = await response.json();

            if (response.ok) {
                if (data.results && data.results.length > 0) {
                    navigation.navigate('K510ResultsScreen', { results: data.results });
                } else {
                    Alert.alert('No Results', 'No 510(k) records found matching your criteria.');
                }
            } else {
                throw new Error(data.message || 'Unable to fetch data');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setError(error.message);
            Alert.alert('Error', 'Failed to fetch data. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const formatDateForDisplay = (date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <ScrollView style={styles.scrollView}>
            <View style={styles.container}>
                <Text style={styles.title}>510(k) Search</Text>

                <UniversalSearchHistory
                    searchType="K510"
                    onSelectHistory={handleHistorySelect}
                />

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>510(k) Number:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter 510(k) Number"
                        value={k510Number}
                        onChangeText={handleK510NumberChange}
                        onFocus={() => setShowSuggestions(true)}
                    />
                    {renderSuggestions()}

                    <Text style={styles.label}>Applicant Name:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter Applicant Name"
                        value={applicantName}
                        onChangeText={setApplicantName}
                        onFocus={() => setShowSuggestions(false)}
                    />

                    <Text style={styles.label}>Device Name:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter Device Name"
                        value={deviceName}
                        onChangeText={setDeviceName}
                        onFocus={() => setShowSuggestions(false)}
                    />
                </View>

                <View style={styles.dateContainer}>
                    <Text style={styles.label}>From Date:</Text>
                    <Button
                        title={formatDateForDisplay(fromDate)}
                        onPress={() => setShowFromDatePicker(true)}
                    />
                    {showFromDatePicker && (
                        <DateTimePicker
                            value={fromDate}
                            mode="date"
                            display="default"
                            onChange={onChangeFrom}
                            maximumDate={new Date()}
                        />
                    )}
                </View>

                <View style={styles.dateContainer}>
                    <Text style={styles.label}>To Date:</Text>
                    <Button
                        title={formatDateForDisplay(toDate)}
                        onPress={() => setShowToDatePicker(true)}
                    />
                    {showToDatePicker && (
                        <DateTimePicker
                            value={toDate}
                            mode="date"
                            display="default"
                            onChange={onChangeTo}
                            maximumDate={new Date()}
                            minimumDate={fromDate}
                        />
                    )}
                </View>

                <TouchableOpacity
                    style={[styles.searchButton, isLoading && styles.searchButtonDisabled]}
                    onPress={handleSearch}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.searchButtonText}>Search</Text>
                    )}
                </TouchableOpacity>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <Text style={styles.note}>
                    Note: Enter at least one search criterion
                </Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        backgroundColor: '#fff',
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
        marginBottom: 5,
        fontWeight: '500',
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
        backgroundColor: '#f9f9f9',
        fontSize: 16,
    },
    dateContainer: {
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
    errorText: {
        color: 'red',
        marginTop: 10,
        textAlign: 'center',
    },
    note: {
        color: '#666',
        fontSize: 12,
        marginTop: 10,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    suggestionsContainer: {
        marginTop: -10,
        marginBottom: 10,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        maxHeight: 200,
    },
    suggestionItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    suggestionText: {
        fontSize: 14,
        color: '#333',
    },
    suggestionValue: {
        color: '#007AFF',
        fontWeight: '500',
    }
});

export default K510Screen;
