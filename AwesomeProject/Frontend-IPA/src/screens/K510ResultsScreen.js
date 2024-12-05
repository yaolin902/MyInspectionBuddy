import React from 'react';
import { StyleSheet, Text, View, FlatList, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const K510ResultsScreen = ({ route }) => {
    const { results } = route.params;

    return (
        <View style={styles.container}>
            <Text style={styles.header}>510K Results</Text>
            <FlatList
                data={results}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                    <View style={styles.item}>
                        <Text style={styles.title}>{item.device_name}</Text>
                        <Text>510K Number: {item.k_number}</Text>
                        <Text>Applicant: {item.applicant}</Text>
                        <Text>Decision Date: {item.decision_date}</Text>
                        <Text>Review Panel: {item.review_panel}</Text>
                        <Text>Product Code: {item.product_code}</Text>
                    </View>
                )}
            />
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
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    item: {
        backgroundColor: '#f9c2ff',
        padding: 20,
        marginVertical: 8,
        marginHorizontal: 16,
        borderRadius: 5,
    },
    title: {
        fontSize: width * 0.04,
        fontWeight: 'bold',
    },
    // Additional styles
});

export default K510ResultsScreen;
