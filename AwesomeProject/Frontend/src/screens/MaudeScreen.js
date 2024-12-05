import React, { useState } from 'react';
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
import { BACKEND_URL } from '../../config.js';

const MaudeScreen = () => {
    const [deviceName, setDeviceName] = useState('');
    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date());
    const [showFromDatePicker, setShowFromDatePicker] = useState(false);
    const [showToDatePicker, setShowToDatePicker] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigation = useNavigation();

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
            // Save to history immediately when search is initiated
            await SearchHistoryService.saveSearch('MAUDE', searchParams);

            const response = await fetch(`${BACKEND_URL}/maude`, {
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
                        onChangeText={setDeviceName}
                    />
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

                {isLoading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#007AFF" />
                        <Text style={styles.loadingText}>
                            Searching MAUDE Database...
                        </Text>
                    </View>
                )}
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
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#333',
    }
});

export default MaudeScreen;