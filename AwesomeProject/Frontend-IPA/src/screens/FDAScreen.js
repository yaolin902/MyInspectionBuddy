import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    Button,
    ScrollView,
    ActivityIndicator,
    Alert
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import UniversalSearchHistory from './UniversalSearchHistory';
import SearchHistoryService from './SearchHistoryService';
import { BACKEND_URL } from '../../config.js';
import { logQuery } from './HomeScreen';

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
    const navigation = useNavigation();

    const handleHistorySelect = (historyItem) => {
        setProductDescription(historyItem.productDescription || '');
        setRecallingFirm(historyItem.recallingFirm || '');
        setRecallNumber(historyItem.recallNumber || '');
        setRecallClass(historyItem.recallClass || '');
        if (historyItem.fromDate) setFromDate(new Date(historyItem.fromDate));
        if (historyItem.toDate) setToDate(new Date(historyItem.toDate));
    };

    const onChangeFrom = (event, selectedDate) => {
        setShowFromDatePicker(false);
        if (selectedDate) {
            setFromDate(selectedDate);
        }
    };

    const onChangeTo = (event, selectedDate) => {
        setShowToDatePicker(false);
        if (selectedDate) {
            setToDate(selectedDate);
        }
    };

    const handleSearch = async () => {
        if (!productDescription.trim()) {
            Alert.alert('Error', 'Please enter a product description');
            return;
        }

        setIsLoading(true);
        setError('');

        const searchParams = {
            productDescription,
            recallingFirm,
            recallNumber,
            recallClass,
            fromDate: fromDate.toISOString().split('T')[0],
            toDate: toDate.toISOString().split('T')[0],
        };

        logQuery("FDA");

        try {
            // Save search history immediately
            await SearchHistoryService.saveSearch('FDA', searchParams);

            const response = await fetch(`${BACKEND_URL}`, {
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
                    Alert.alert('No Results', 'No recalls found matching your search criteria.');
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
                        onChangeText={setProductDescription}
                        multiline
                    />

                    <Text style={styles.label}>Recalling Firm:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter recalling firm"
                        value={recallingFirm}
                        onChangeText={setRecallingFirm}
                    />

                    <Text style={styles.label}>Recall Number:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter recall number"
                        value={recallNumber}
                        onChangeText={setRecallNumber}
                    />

                    <Text style={styles.label}>Recall Class:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter recall class"
                        value={recallClass}
                        onChangeText={setRecallClass}
                    />
                </View>

                <View style={styles.dateContainer}>
                    <Text style={styles.label}>From Date:</Text>
                    <Button
                        title={fromDate.toLocaleDateString()}
                        onPress={() => setShowFromDatePicker(true)}
                    />
                    {showFromDatePicker && (
                        <DateTimePicker
                            value={fromDate}
                            mode="date"
                            display="default"
                            onChange={onChangeFrom}
                        />
                    )}
                </View>

                <View style={styles.dateContainer}>
                    <Text style={styles.label}>To Date:</Text>
                    <Button
                        title={toDate.toLocaleDateString()}
                        onPress={() => setShowToDatePicker(true)}
                    />
                    {showToDatePicker && (
                        <DateTimePicker
                            value={toDate}
                            mode="date"
                            display="default"
                            onChange={onChangeTo}
                        />
                    )}
                </View>

                <View style={styles.buttonContainer}>
                    <Button
                        title={isLoading ? "Searching..." : "Search"}
                        onPress={handleSearch}
                        disabled={isLoading}
                    />
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                {isLoading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#0000ff" />
                    </View>
                )}

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
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
        backgroundColor: '#f9f9f9',
    },
    dateContainer: {
        marginBottom: 15,
    },
    buttonContainer: {
        marginTop: 10,
        marginBottom: 20,
    },
    loadingContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    errorText: {
        color: 'red',
        marginTop: 10,
        textAlign: 'center',
    },
    requiredField: {
        color: 'gray',
        fontSize: 12,
        marginTop: 10,
        textAlign: 'center',
    }
});

export default FDAScreen;