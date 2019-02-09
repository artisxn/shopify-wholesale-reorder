import {
    Frame,
    Autocomplete,
    Page,
    Card,
    ResourceList,
    TextStyle,
    Avatar,
    Select,
    Layout,
    Icon,
    FormLayout,
    TextField,
    ContextualSaveBar,
    Stack,
    Badge
} from "@shopify/polaris";
import React from "react";
import axios from "axios";
import _ from 'lodash';

export default class Reorder extends React.Component {
    state = {
        dateRange: '60',
        customersLoading: false,
        ordersLoading: false,
        customers: {},
        customerOptions: [],
        selectedCustomerName: '',
        products: [],
        customer: {},
        errors: {},
        inputText: '',
        totalItems: 0,
        totalCost: 0.0,
        orderId: null,
        orderSaving: false,
    };

    dateRangeChanged = (newRange) => {
        this.setState({dateRange: newRange}, this.getOrders);
    };

    customerSelected = (updatedSelection) => {
        const selectedOption = updatedSelection.map((selectedItem) => {
            const matchedOption = this.state.customerOptions.filter((option) => {
                return option.value === selectedItem;
            });
            return matchedOption[0];
        });

        this.setState({
            selectedCustomerName: selectedOption[0].label,
            inputText: selectedOption[0].label,
            customer: selectedOption[0].value
        }, () => {
            this.getOrders();
        })
    };

    updateProduct = (i, property, value) => {
        let products = [...this.state.products];
        let product = {...products[i]};
        let prevValue;
        value = Math.max(parseInt(value), 0);
        // noinspection FallThroughInSwitchStatementJS If stock is updated also update order quantity
        switch (property) {
            case 'stock':
                product.stock = value;
                value = Math.max(0, product.quantity-value);
            case 'order':
                prevValue = product.order;
                product.order = value;
                break;
        }
        products[i] = product;

        const price = parseFloat(product.price);

        this.setState({
            products,
            totalItems: this.state.totalItems - prevValue + value,
            totalCost: this.state.totalCost - ( prevValue * price) + (value * price)
        });
    };

    render() {

        const customerSearch = (
            <Autocomplete.TextField
                onChange={this.searchCustomers}
                label="Customer"
                value={this.state.inputText}
                error={this.state.errors.customer_id}
                prefix={<Icon source="profile" color="inkLighter" />}
            />
        );

        const dateOptions = [
            {label: '30 Days', value: '30'},
            {label: '45 Days', value: '45'},
            {label: '60 Days', value: '60'},
            {label: '75 Days', value: '75'},
            {label: '90 Days', value: '90'},
            {label: '120 Days', value: '120'},
        ];

        return <Page title="Reorder">
            <Frame>
                {this.state.totalItems > 0 &&
                    <ContextualSaveBar
                        alignContentFlush
                        message={
                            this.state.orderId === null
                                ? this.state.totalItems + ' item(s). Total Cost: $' + this.state.totalCost
                                : 'Order has been created as draft'
                        }
                        saveAction={{
                            loading: this.state.orderSaving,
                            content: this.state.orderId === null ? 'Place Order' : 'Open Order',
                            onAction: this.state.orderId === null ? this.placeOrder : this.openOrder,
                        }}
                    />
                }
                <Card>
                    <Card.Section>
                        <Layout>
                            <Layout.Section>
                                <Autocomplete
                                    loading={this.state.customersLoading}
                                    options={this.state.customerOptions}
                                    selected={this.state.selectedCustomerName}
                                    onSelect={this.customerSelected}
                                    preferredPosition="below"
                                    textField={customerSearch} />
                            </Layout.Section>
                            <Layout.Section secondary>
                                <Select
                                    label="Date range"
                                    options={dateOptions}
                                    onChange={this.dateRangeChanged}
                                    value={this.state.dateRange}
                                />
                            </Layout.Section>
                        </Layout>
                    </Card.Section>

                    <ResourceList
                        resourceName={{singular: 'product', plural: 'products'}}
                        items={this.state.products}
                        idForItem={(item, index) => index}
                        loading={this.state.ordersLoading}
                        renderItem={(item, index) => {
                            const {id, title, image, sku, quantity, stock, order, tags} = item;
                            const media = !_.has(item, 'image') ? null : <Avatar size="medium" source={image} />;

                            return (
                                <ResourceList.Item
                                    id={id}
                                    media={media}
                                    accessibilityLabel={`View details for ${title}`}
                                >
                                    <h3 className="ProductListItem__Title">
                                        <TextStyle variation="strong">{title}</TextStyle>
                                        {(_.includes(tags, 'PhaseOut') || _.includes(tags, 'Overstock')) &&
                                        <Stack>
                                            {_.includes(tags, 'PhaseOut') && <Badge status="warning">PhaseOut</Badge>}
                                            {_.includes(tags, 'Overstock') && <Badge status="warning">Overstock</Badge>}
                                        </Stack>
                                        }
                                    </h3>
                                    <div className="ProductListItem__Sku">{sku}</div>
                                    <FormLayout>
                                        <FormLayout.Group condensed>
                                            <TextField
                                                label="Quantity"
                                                value={quantity}
                                                readOnly
                                            />
                                            <TextField
                                                label="In Stock"
                                                value={stock}
                                                type="number"
                                                onChange={(value) => (this.updateProduct(index, 'stock', value))}
                                            />
                                            <TextField
                                                label="Sold"
                                                value={quantity-stock}
                                                readOnly
                                            />
                                            <TextField
                                                label="Order"
                                                value={order}
                                                type="number"
                                                onChange={(value) => (this.updateProduct(index, 'order', value))}
                                            />
                                        </FormLayout.Group>
                                    </FormLayout>
                                </ResourceList.Item>
                            );
                        }}
                    />
                </Card>
            </Frame>
        </Page>;
    }

    searchCustomers = (newValue) => {
        this.setState({
            inputText: newValue,
            customersLoading: true,
            customerOptions: []
        });
        this.filterAndUpdateOptions(newValue)
    };

    populateCustomers = (customers) => {
        let customerOptions = Object.keys(customers).map((customer) => {
            return {
                value: customers[customer].id,
                id: customers[customer].id,
                label: `${customers[customer].first_name} ${customers[customer].last_name}`
            }
        }) ;

        this.setState(prevState => ({
            customerOptions,
            customers
        }));
    };

    filterAndUpdateOptions = _.debounce((inputString) => {
        axios.get('/api/customers', {params: {q: inputString}})
            .then(response => {
                this.populateCustomers(response.data);
            })
            .catch(console.error)
            .finally(() => {
                this.setState({customersLoading: false});
            });
    }, 400);

    getOrders = () => {
        this.setState({
            ordersLoading: true
        });

        axios.get(`/api/customers/${this.state.customer}/orders`, {
                params: {
                    dateRange: this.state.dateRange
                }
            })
            .then(response => {
                this.setState({
                    products: _.map(response.data, (product) => {
                        product.stock = product.quantity;
                        product.order = 0;
                        return product;
                    }),
                    totalItems: 0,
                    totalCost: 0.0
                });
            })
            .catch(console.error)
            .finally(() => {
                this.setState({ordersLoading: false});
            });
    };

    placeOrder = () => {
        let line_items = _.filter(this.state.products, (item) => {
            return item.order > 0;
        });

        line_items = _.map(line_items, function(item) {
            return {
                variant_id: item.variant_id,
                quantity: item.order
            }
        });

        this.setState({orderSaving: true});

        axios.post(`/api/customers/${this.state.customer}/orders`, {
            items: line_items,
        })
            .then(response => {
                this.setState({
                    orderId: response.data.id
                });
            })
            .catch(console.error)
            .finally(() => {
                this.setState({orderSaving: false});
            });

    }

    openOrder = () => {
        let url = 'https://'+document.head.querySelector('meta[name="shopify-shop-origin"]').content + '/';
        url = url + 'admin/draft_orders/' + this.state.orderId;

        window.open(url, '_blank');

        this.setState({
            orderId: null,
            selectedCustomerName: '',
            products: [],
            customer: {},
            inputText: '',
            totalItems: 0,
            totalCost: 0.0,
        });
    }

}