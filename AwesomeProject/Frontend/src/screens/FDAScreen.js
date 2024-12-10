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
    TouchableOpacity
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import UniversalSearchHistory from './UniversalSearchHistory';
import SearchHistoryService from './SearchHistoryService';
import { BACKEND_URL } from '../../config.js';

const FDAScreen = () => {
    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date());
    const [showFromDatePicker, setShowFromDatePicker] = useState(false);
    const [showToDatePicker, setShowToDatePicker] = useState(false);
    const [productDescription, setProductDescription] = useState('');
    const [recallingFirm, setRecallingFirm] = useState('');
    const [recallNumber, setRecallNumber] = useState('');
    const [recallClass, setRecallClass] = useState('');
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
            const history = await SearchHistoryService.getHistory('FDA');
            setSuggestions(history);
        } catch (error) {
            console.error('Error loading historical searches:', error);
        }
    };

    const handleProductDescriptionChange = (text) => {
        setProductDescription(text);
        setShowSuggestions(text.length > 0);
    };

    const handleSuggestionSelect = (historyItem) => {
        setProductDescription(historyItem.productDescription || '');
        setRecallingFirm(historyItem.recallingFirm || '');
        setRecallNumber(historyItem.recallNumber || '');
        setRecallClass(historyItem.recallClass || '');

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
        if (!showSuggestions || !productDescription.trim()) return null;

        const filteredSuggestions = suggestions.filter(item =>
            item.productDescription &&
            item.productDescription.toLowerCase().includes(productDescription.toLowerCase())
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
                        <Text style={styles.suggestionPrimary}>{item.productDescription}</Text>
                        <Text style={styles.suggestionSecondary}>
                            {[
                                item.recallingFirm && `Firm: ${item.recallingFirm}`,
                                item.recallNumber && `Recall #: ${item.recallNumber}`,
                                item.recallClass && `Class: ${item.recallClass}`
                            ].filter(Boolean).join('\n')}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const handleHistorySelect = (historyItem) => {
        setProductDescription(historyItem.productDescription || '');
        setRecallingFirm(historyItem.recallingFirm || '');
        setRecallNumber(historyItem.recallNumber || '');
        setRecallClass(historyItem.recallClass || '');

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
        if (!productDescription.trim()) {
            Alert.alert('Error', 'Please enter a product description');
            return;
        }

        setIsLoading(true);
        setError('');
        setShowSuggestions(false);

        const searchParams = {
            productDescription: productDescription.trim(),
            recallingFirm: recallingFirm.trim(),
            recallNumber: recallNumber.trim(),
            recallClass: recallClass.trim(),
            fromDate: fromDate.toISOString().split('T')[0],
            toDate: toDate.toISOString().split('T')[0],
        };

        try {
            await SearchHistoryService.saveSearch('FDA', searchParams);
            await loadHistoricalSearches();

            const response = await fetch(`${BACKEND_URL}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(searchParams),
            });

            const data = await response.json();

            if (response.ok) {
                if (data.results && data.results.length > 0) {
                    navigation.navigate('FDAResultsScreen', {
                        results: data.results
                    });
                } else {
                    Alert.alert('No Results', 'No recalls found matching your criteria.');
                }
            } else {
                throw new Error(data.error || 'Unable to fetch data');
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
                <Text style={styles.title}>FDA Enforcement Recall Search</Text>

                <UniversalSearchHistory
                    searchType="FDA"
                    onSelectHistory={handleHistorySelect}
                />

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Product Description: *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter product description"
                        value={productDescription}
                        onChangeText={handleProductDescriptionChange}
                        onFocus={() => setShowSuggestions(true)}
                        multiline
                    />
                    {renderSuggestions()}

                    <Text style={styles.label}>Recalling Firm:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter recalling firm"
                        value={recallingFirm}
                        onChangeText={setRecallingFirm}
                        onFocus={() => setShowSuggestions(false)}
                    />

                    <Text style={styles.label}>Recall Number:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter recall number"
                        value={recallNumber}
                        onChangeText={setRecallNumber}
                        onFocus={() => setShowSuggestions(false)}
                    />

                    <Text style={styles.label}>Recall Class:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter recall class"
                        value={recallClass}
                        onChangeText={setRecallClass}
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
                <Text style={styles.requiredField}>* Required field</Text>
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
    requiredField: {
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

export default FDAScreen;