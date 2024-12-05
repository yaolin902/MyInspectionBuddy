import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Dimensions } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BACKEND_URL } from '../../config.js';
import { logQuery } from './HomeScreen';

const { width } = Dimensions.get('window');

const LicenseScreen = ({ navigation }) => {
    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date());
    const [businessName, setBusinessName] = useState('');
    const [licenseCodeDescription, setLicenseCodeDescription] = useState('');
    const [licenseStatusCode, setLicenseStatusCode] = useState('');
    const [licenseAddressTypeDescription, setLicenseAddressTypeDescription] = useState('');
    const [addressLine1, setAddressLine1] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [zip, setZip] = useState('');
    const [countyCode, setCountyCode] = useState('');
    const [showFromDatePicker, setShowFromDatePicker] = useState(false);
    const [showToDatePicker, setShowToDatePicker] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const onChangeFrom = (event, selectedDate) => {
        const currentDate = selectedDate || fromDate;
        setShowFromDatePicker(false);
        setFromDate(currentDate);
    };

    const onChangeTo = (event, selectedDate) => {
        const currentDate = selectedDate || toDate;
        setShowToDatePicker(false);
        setToDate(currentDate);
    };

    const handleSearch = async () => {
        setIsLoading(true);
        setError('');
        logQuery("LicenseSearch")

        try {
            const response = await fetch(`${BACKEND_URL}/license-search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    businessName,
                    licenseCodeDescription,
                    licenseStatusCode,
                    licenseAddressTypeDescription,
                    addressLine1,
                    city,
                    state,
                    zip,
                    countyCode,
                    fromDate: fromDate.toISOString().split('T')[0],
                    toDate: toDate.toISOString().split('T')[0],
                })
            });

            console.log('Response Status:', response.status);
            console.log('Response Headers:', response.headers);

            const data = await response.json();
            console.log('Response Data:', data);

            if (response.ok) {
                navigation.navigate('LicenseResult', { results: data || [] });
                setIsLoading(false);
            } else {
                throw new Error(data.message || 'Unable to fetch data');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setError(error.message);
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>FDBIP License Search</Text>
            <View style={styles.inputContainer}>
                <Text>Firm Name:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Search Bar"
                    value={businessName}
                    onChangeText={setBusinessName}
                />
                <Text>License:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Search Bar"
                    value={licenseCodeDescription}
                    onChangeText={setLicenseCodeDescription}
                />
                <Text>License Status:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Search Bar"
                    value={licenseStatusCode}
                    onChangeText={setLicenseStatusCode}
                />
                <Text>License Address Type:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Search Bar"
                    value={licenseAddressTypeDescription}
                    onChangeText={setLicenseAddressTypeDescription}
                />
                <Text>Address Line:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Search Bar"
                    value={addressLine1}
                    onChangeText={setAddressLine1}
                />
                <Text>City:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Search Bar"
                    value={city}
                    onChangeText={setCity}
                />
                <Text>State:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Search Bar"
                    value={state}
                    onChangeText={setState}
                />
                <Text>Zip:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Search Bar"
                    value={zip}
                    onChangeText={setZip}
                />
                <Text>County:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Search Bar"
                    value={countyCode}
                    onChangeText={setCountyCode}
                />
            </View>
            <View style={styles.dateInputContainer}>
                <Text>Start Expiration Date:</Text>
                <Button title="Select Date" onPress={() => setShowFromDatePicker(true)} />
                {showFromDatePicker && (
                    <DateTimePicker
                        testID="dateTimePickerFrom"
                        value={fromDate}
                        mode="date"
                        display="default"
                        onChange={onChangeFrom}
                    />
                )}
            </View>
            <View style={styles.dateInputContainer}>
                <Text>End Expiration Date:</Text>
                <Button title="Select Date" onPress={() => setShowToDatePicker(true)} />
                {showToDatePicker && (
                    <DateTimePicker
                        testID="dateTimePickerTo"
                        value={toDate}
                        mode="date"
                        display="default"
                        onChange={onChangeTo}
                    />
                )}
            </View>
            <Button title="Search" onPress={handleSearch} />
            {isLoading && <Text>Loading...</Text>}
            {error && <Text>Error: {error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    inputContainer: {
        alignSelf: 'stretch',
        marginBottom: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: 'black',
        padding: 10,
        marginBottom: 10,
    },
    dateInputContainer: {
        marginBottom: 10,
    },
    // Additional styles
});

export default LicenseScreen;