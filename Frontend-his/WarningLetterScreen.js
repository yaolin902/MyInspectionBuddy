import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Button,
    Alert,
    ScrollView,
    ActivityIndicator,
    Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import UniversalSearchHistory from './UniversalSearchHistory';
import SearchHistoryService from './SearchHistoryService';

const MaudeScreen = () => {
    const [deviceName, setDeviceName] = useState('');
    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date());
    const [showFromDatePicker, setShowFromDatePicker] = useState(false);
    const [showToDatePicker, setShowToDatePicker] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const navigation = useNavigation();

    useEffect(() => {
        loadHistoricalSearches();
    }, []);

    const loadHistoricalSearches = async () => {
        try {
            const history = await SearchHistoryService.getHistory('MAUDE');
            setSuggestions(history);
        } catch (error) {
            console.error('Error loading historical searches:', error);
        }
    };

    const handleDeviceNameChange = (text) => {
        setDeviceName(text);
        setShowSuggestions(text.length > 0);
    };

    const handleSuggestionSelect = (historyItem) => {
        setDeviceName(historyItem.deviceName || '');

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
        if (!showSuggestions || !deviceName.trim()) return null;

        const filteredSuggestions = suggestions.filter(item =>
            item.deviceName &&
            item.deviceName.toLowerCase().includes(deviceName.toLowerCase())
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
                        <Text style={styles.suggestionPrimary}>{item.deviceName}</Text>
                        <Text style={styles.suggestionSecondary}>
                            {`Search Period: ${formatDateForDisplay(new Date(item.fromDate))} - ${formatDateForDisplay(new Date(item.toDate))}`}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const handleHistorySelect = (historyItem) => {
        setDeviceName(historyItem.deviceName || '');
        if (historyItem.fromDate) {
            setFromDate(new Date(historyItem.fromDate));
        }
        if (historyItem.toDate) {
            setToDate(new Date(historyItem.toDate));
        }
    };

    const onChangeFromDate = (event, selectedDate) => {
        const currentDate = selectedDate || fromDate;
        setShowFromDatePicker(Platform.OS === 'ios');
        setFromDate(currentDate);
    };

    const onChangeToDate = (event, selectedDate) => {
        const currentDate = selectedDate || toDate;
        setShowToDatePicker(Platform.OS === 'ios');
        setToDate(currentDate);
    };

    const validateSearch = () => {
        if (!deviceName.trim()) {
            Alert.alert('Validation Error', 'Please enter a device name');
            return false;
        }
        return true;
    };

    const fetchData = async () => {
        if (!validateSearch()) return;

        setIsLoading(true);

        const searchParams = {
            deviceName: deviceName.trim(),
            fromDate: fromDate.toISOString().split('T')[0],
            toDate: toDate.toISOString().split('T')[0],
        };

        try {
            await SearchHistoryService.saveSearch('MAUDE', searchParams);
            await loadHistoricalSearches();

            const response = await fetch('http://10.0.0.3:5001/maude', {
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
                if (result.results && result.results.length > 0) {
                    navigation.navigate('MaudeResultsScreen', { results: result.results });
                } else {
                    Alert.alert('No Results', 'No records found for the provided criteria.');
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            Alert.alert('Error', 'Failed to fetch data from the server');
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
                <Text style={styles.title}>MAUDE Database Search</Text>

                <UniversalSearchHistory
                    searchType="MAUDE"
                    onSelectHistory={handleHistorySelect}
                />

                <View style={styles.searchSection}>
                    <Text style={styles.label}>Device Generic Name: *</Text>
                    <TextInput
                        style={styles.searchBar}
                        placeholder="Enter Device Generic Name"
                        value={deviceName}
                        onChangeText={handleDeviceNameChange}
                        onFocus={() => setShowSuggestions(true)}
                    />
                    {renderSuggestions()}
                </View>

                <View style={styles.dateSection}>
                    <Text style={styles.label}>From Date:</Text>
                    <Button
                        title={formatDateForDisplay(fromDate)}
                        onPress={() => setShowFromDatePicker(true)}
                    />
                    {showFromDatePicker && (
                        <DateTimePicker
                            testID="dateTimePickerFrom"
                            value={fromDate}
                            mode="date"
                            display="default"
                            onChange={onChangeFromDate}
                            maximumDate={new Date()}
                        />
                    )}

                    <Text style={[styles.label, { marginTop: 15 }]}>To Date:</Text>
                    <Button
                        title={formatDateForDisplay(toDate)}
                        onPress={() => setShowToDatePicker(true)}
                    />
                    {showToDatePicker && (
                        <DateTimePicker
                            testID="dateTimePickerTo"
                            value={toDate}
                            mode="date"
                            display="default"
                            onChange={onChangeToDate}
                            maximumDate={new Date()}
                            minimumDate={fromDate}
                        />
                    )}
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
    searchSection: {
        width: '100%',
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        fontWeight: '500',
        color: '#333',
    },
    searchBar: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#fff',
        fontSize: 16,
    },
    dateSection: {
        width: '100%',
        marginBottom: 20,
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
        marginTop: 5,
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

export default MaudeScreen;
