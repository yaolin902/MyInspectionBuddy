import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    Button,
    ScrollView,
    ActivityIndicator,
    Alert,
    Platform // Added Platform import
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import UniversalSearchHistory from './UniversalSearchHistory';
import SearchHistoryService from './SearchHistoryService';


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
    const navigation = useNavigation();

    const parseDateFromString = (dateString) => {
        if (!dateString) return null;
        try {
            let date;
            if (dateString.includes('T')) {
                date = new Date(dateString);
            } else {
                const [year, month, day] = dateString.split('-').map(Number);
                date = new Date(year, month - 1, day);
            }
            return date;
        } catch (error) {
            console.error('Error parsing date:', error);
            return null;
        }
    };

    const handleHistorySelect = (historyItem) => {
        setK510Number(historyItem.k510Number || '');
        setApplicantName(historyItem.applicantName || '');
        setDeviceName(historyItem.deviceName || '');

        // Handle fromDate
        if (historyItem.fromDate) {
            const parsedFromDate = parseDateFromString(historyItem.fromDate);
            if (parsedFromDate && !isNaN(parsedFromDate.getTime())) {
                setFromDate(parsedFromDate);
            }
        }

        // Handle toDate
        if (historyItem.toDate) {
            const parsedToDate = parseDateFromString(historyItem.toDate);
            if (parsedToDate && !isNaN(parsedToDate.getTime())) {
                setToDate(parsedToDate);
            }
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

        const searchParams = {
            k510Number: k510Number.trim(),
            applicantName: applicantName.trim(),
            deviceName: deviceName.trim(),
            fromDate: fromDate.toISOString().split('T')[0],
            toDate: toDate.toISOString().split('T')[0],
        };

        try {
            // Save search history immediately
            await SearchHistoryService.saveSearch('K510', searchParams);

            const response = await fetch('http://10.0.0.63:5001/k510', {
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
                        onChangeText={setK510Number}
                    />

                    <Text style={styles.label}>Applicant Name:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter Applicant Name"
                        value={applicantName}
                        onChangeText={setApplicantName}
                    />

                    <Text style={styles.label}>Device Name:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter Device Name"
                        value={deviceName}
                        onChangeText={setDeviceName}
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
    note: {
        color: 'gray',
        fontSize: 12,
        marginTop: 10,
        textAlign: 'center',
        fontStyle: 'italic',
    }
});

export default K510Screen;