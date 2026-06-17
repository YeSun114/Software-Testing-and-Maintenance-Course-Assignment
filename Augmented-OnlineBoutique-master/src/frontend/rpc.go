// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"
	"time"

	pb "github.com/GoogleCloudPlatform/microservices-demo/src/frontend/genproto"
	"github.com/pkg/errors"
)

const (
	avoidNoopCurrencyConversionRPC = false
)

func (fe *frontendServer) getCurrencies(ctx context.Context) ([]string, error) {
	currs, err := pb.NewCurrencyServiceClient(fe.currencySvcConn).
		GetSupportedCurrencies(ctx, &pb.Empty{})

	if err != nil {
		return nil, err
	}
	var out []string
	for _, c := range currs.CurrencyCodes {
		if _, ok := whitelistedCurrencies[c]; ok {
			out = append(out, c)
		}
	}
	return out, nil
}

func (fe *frontendServer) getProducts(ctx context.Context) ([]*pb.Product, error) {
	resp, err := pb.NewProductCatalogServiceClient(fe.productCatalogSvcConn).
		ListProducts(ctx, &pb.Empty{})
	return resp.GetProducts(), err
}

func (fe *frontendServer) getProduct(ctx context.Context, id string) (*pb.Product, error) {
	resp, err := pb.NewProductCatalogServiceClient(fe.productCatalogSvcConn).
		GetProduct(ctx, &pb.GetProductRequest{Id: id})
	return resp, err
}

func (fe *frontendServer) getCart(ctx context.Context, userID string) ([]*pb.CartItem, error) {
	resp, err := pb.NewCartServiceClient(fe.cartSvcConn).GetCart(ctx, &pb.GetCartRequest{UserId: userID})
	return resp.GetItems(), err
}

func (fe *frontendServer) emptyCart(ctx context.Context, userID string) error {
	_, err := pb.NewCartServiceClient(fe.cartSvcConn).EmptyCart(ctx, &pb.EmptyCartRequest{UserId: userID})
	return err
}

func (fe *frontendServer) insertCart(ctx context.Context, userID, productID string, quantity int32) error {
	_, err := pb.NewCartServiceClient(fe.cartSvcConn).AddItem(ctx, &pb.AddItemRequest{
		UserId: userID,
		Item: &pb.CartItem{
			ProductId: productID,
			Quantity:  quantity},
	})
	return err
}

func (fe *frontendServer) convertCurrency(ctx context.Context, money *pb.Money, currency string) (*pb.Money, error) {
	if avoidNoopCurrencyConversionRPC && money.GetCurrencyCode() == currency {
		return money, nil
	}
	return pb.NewCurrencyServiceClient(fe.currencySvcConn).
		Convert(ctx, &pb.CurrencyConversionRequest{
			From:   money,
			ToCode: currency})
}

func (fe *frontendServer) getShippingQuote(ctx context.Context, items []*pb.CartItem, currency string) (*pb.Money, error) {
	quote, err := pb.NewShippingServiceClient(fe.shippingSvcConn).GetQuote(ctx,
		&pb.GetQuoteRequest{
			Address: nil,
			Items:   items})
	if err != nil {
		return nil, err
	}
	localized, err := fe.convertCurrency(ctx, quote.GetCostUsd(), currency)
	return localized, errors.Wrap(err, "failed to convert currency for shipping cost")
}

func (fe *frontendServer) getRecommendations(ctx context.Context, userID string, productIDs []string) ([]*pb.Product, error) {
	resp, err := pb.NewRecommendationServiceClient(fe.recommendationSvcConn).ListRecommendations(ctx,
		&pb.ListRecommendationsRequest{UserId: userID, ProductIds: productIDs})
	if err != nil {
		return nil, err
	}
	out := make([]*pb.Product, len(resp.GetProductIds()))
	for i, v := range resp.GetProductIds() {
		p, err := fe.getProduct(ctx, v)
		if err != nil {
			return nil, errors.Wrapf(err, "failed to get recommended product info (#%s)", v)
		}
		out[i] = p
	}
	if len(out) > 4 {
		out = out[:4] // take only first four to fit the UI
	}
	return out, err
}

func (fe *frontendServer) getAd(ctx context.Context, ctxKeys []string) ([]*pb.Ad, error) {
	ctx, cancel := context.WithTimeout(ctx, time.Millisecond*1000)
	defer cancel()

	resp, err := pb.NewAdServiceClient(fe.adSvcConn).GetAds(ctx, &pb.AdRequest{
		ContextKeys: ctxKeys,
	})
	return resp.GetAds(), errors.Wrap(err, "failed to get ads")
}

// discountResponse 对应 vip-discount-service 返回的 JSON
type discountResponse struct {
	OriginalPrice   float64 `json:"original_price"`
	DiscountedPrice float64 `json:"discounted_price"`
	Message         string  `json:"message"`
}

// moneyToFloat 将 pb.Money 转为 float64 用于 HTTP 调用
func moneyToFloat(m *pb.Money) float64 {
	return float64(m.GetUnits()) + float64(m.GetNanos())/1000000000.0
}

// floatToMoney 将 float64 转回 pb.Money，保留货币代码
func floatToMoney(price float64, currencyCode string) *pb.Money {
	units := int64(price)
	nanos := int32((price - float64(units)) * 1000000000.0)
	return &pb.Money{
		Units:        units,
		Nanos:        nanos,
		CurrencyCode: currencyCode,
	}
}

// getVIPDiscount 调用 vip-discount-service 获取 VIP 折扣价
func (fe *frontendServer) getVIPDiscount(ctx context.Context, price float64) (*discountResponse, error) {
	url := fmt.Sprintf("http://%s/calculate_discount?price=%.2f", fe.discountSvcAddr, price)

	ctx, cancel := context.WithTimeout(ctx, time.Second*2)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, errors.Wrap(err, "failed to create discount request")
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, errors.Wrap(err, "failed to call discount service")
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, errors.Wrap(err, "failed to read discount response")
	}

	var discountResp discountResponse
	if err := json.Unmarshal(body, &discountResp); err != nil {
		return nil, errors.Wrap(err, "failed to parse discount response")
	}

	return &discountResp, nil
}

// commentItem 对应评论服务返回的单条评论
type commentItem struct {
	ID        int     `json:"id"`
	ProductID string  `json:"product_id"`
	UserName  string  `json:"user_name"`
	Content   string  `json:"content"`
	Rating    float64 `json:"rating"`
	CreatedAt string  `json:"created_at"`
}

// getProductComments 获取某商品的所有评论
func (fe *frontendServer) getProductComments(ctx context.Context, productID string) ([]commentItem, error) {
	url := fmt.Sprintf("http://%s/api/comments/%s", fe.commentSvcAddr, productID)

	ctx, cancel := context.WithTimeout(ctx, time.Second*2)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, errors.Wrap(err, "failed to create comments request")
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, errors.Wrap(err, "failed to call comment service")
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, errors.Wrap(err, "failed to read comments response")
	}

	var comments []commentItem
	if err := json.Unmarshal(body, &comments); err != nil {
		return nil, errors.Wrap(err, "failed to parse comments response")
	}

	return comments, nil
}

// postComment 提交一条评论到 comment-service
func (fe *frontendServer) postComment(ctx context.Context, productID, userName, content, rating string) error {
	url := fmt.Sprintf("http://%s/api/comments", fe.commentSvcAddr)
	jsonBody := fmt.Sprintf(`{"product_id":"%s","user_name":"%s","content":"%s","rating":%s}`,
		productID, userName, content, rating)

	ctx, cancel := context.WithTimeout(ctx, time.Second*2)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, strings.NewReader(jsonBody))
	if err != nil {
		return errors.Wrap(err, "failed to create comment post request")
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return errors.Wrap(err, "failed to call comment service to post")
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		body, _ := ioutil.ReadAll(resp.Body)
		return fmt.Errorf("comment service returned status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

// promoImageInfo 对应 image-show-service 返回的图片信息
type promoImageInfo struct {
	Filename string `json:"filename"`
	URL      string `json:"url"`
}

// getPromoImageURL 获取当前促销图片的路径
func (fe *frontendServer) getPromoImageURL(ctx context.Context) (*promoImageInfo, error) {
	url := "http://" + fe.imageSvcAddr + "/api/current-image"

	ctx, cancel := context.WithTimeout(ctx, time.Second*2)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, errors.Wrap(err, "failed to create promo image request")
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, errors.Wrap(err, "failed to call image service")
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, errors.Wrap(err, "failed to read image service response")
	}

	var info promoImageInfo
	if err := json.Unmarshal(body, &info); err != nil {
		return nil, errors.Wrap(err, "failed to parse image service response")
	}

	return &info, nil
}

// getPromoImageBytes 从 image-show-service 获取图片字节
func (fe *frontendServer) getPromoImageBytes(ctx context.Context, imagePath string) ([]byte, string, error) {
	url := "http://" + fe.imageSvcAddr + imagePath

	ctx, cancel := context.WithTimeout(ctx, time.Second*3)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, "", errors.Wrap(err, "failed to create image request")
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, "", errors.Wrap(err, "failed to fetch image")
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, "", errors.Wrap(err, "failed to read image bytes")
	}

	contentType := resp.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "image/png"
	}

	return body, contentType, nil
}

// couponResponse 对应 coupon-service 返回的验证结果
type couponResponse struct {
	Valid      bool    `json:"valid"`
	Code       string  `json:"code"`
	Type       string  `json:"type"`
	Discount   float64 `json:"discount"`
	FinalPrice float64 `json:"final_price"`
	Desc       string  `json:"desc"`
	Error      string  `json:"error"`
}

// validateCoupon 调用 coupon-service 验证优惠券
func (fe *frontendServer) validateCoupon(ctx context.Context, code string, price float64) (*couponResponse, error) {
	url := "http://" + fe.couponSvcAddr + "/api/validate"
	jsonBody := fmt.Sprintf(`{"code":"%s","price":%.2f}`, code, price)

	ctx, cancel := context.WithTimeout(ctx, time.Second*2)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, strings.NewReader(jsonBody))
	if err != nil {
		return nil, errors.Wrap(err, "failed to create coupon request")
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, errors.Wrap(err, "failed to call coupon service")
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, errors.Wrap(err, "failed to read coupon response")
	}

	var cr couponResponse
	if err := json.Unmarshal(body, &cr); err != nil {
		return nil, errors.Wrap(err, "failed to parse coupon response")
	}

	return &cr, nil
}

// couponItem 对应优惠券列表中的单项
type couponListItem struct {
	Code  string  `json:"code"`
	Type  string  `json:"type"`
	Value float64 `json:"value"`
	Desc  string  `json:"desc"`
}

// getCouponList 获取所有可用优惠券列表
func (fe *frontendServer) getCouponList(ctx context.Context) ([]couponListItem, error) {
	url := "http://" + fe.couponSvcAddr + "/api/coupons"

	ctx, cancel := context.WithTimeout(ctx, time.Second*2)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, errors.Wrap(err, "failed to create coupon list request")
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, errors.Wrap(err, "failed to call coupon service")
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, errors.Wrap(err, "failed to read coupon list response")
	}

	var coupons []couponListItem
	if err := json.Unmarshal(body, &coupons); err != nil {
		return nil, errors.Wrap(err, "failed to parse coupon list")
	}

	return coupons, nil
}

// orderHistoryItem 对应订单历史服务返回的单条记录
type orderHistoryItem struct {
	ID            int    `json:"id"`
	SessionID     string `json:"session_id"`
	OrderID       string `json:"order_id"`
	ItemsJSON     string `json:"items_json"`
	ShippingCost  string `json:"shipping_cost"`
	TotalPaid     string `json:"total_paid"`
	DiscountSaved string `json:"discount_saved"`
	Currency      string `json:"currency"`
	CreatedAt     string `json:"created_at"`
}

// getOrderHistory 获取某个 session 的历史订单
func (fe *frontendServer) getOrderHistory(ctx context.Context, sessionID string) ([]orderHistoryItem, error) {
	url := "http://" + fe.orderHistorySvcAddr + "/api/orders?session_id=" + sessionID

	ctx, cancel := context.WithTimeout(ctx, time.Second*2)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, errors.Wrap(err, "failed to create order history request")
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, errors.Wrap(err, "failed to call order history service")
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, errors.Wrap(err, "failed to read order history response")
	}

	var orders []orderHistoryItem
	if err := json.Unmarshal(body, &orders); err != nil {
		return nil, errors.Wrap(err, "failed to parse order history")
	}

	return orders, nil
}

// saveOrderToHistory 下单后将订单记录到 order-history-service
func (fe *frontendServer) saveOrderToHistory(ctx context.Context, sessionID, orderID, itemsJSON, shippingCost, totalPaid, discountSaved, currency string) error {
	url := "http://" + fe.orderHistorySvcAddr + "/api/orders"
	jsonBody := fmt.Sprintf(`{"session_id":"%s","order_id":"%s","items_json":%s,"shipping_cost":"%s","total_paid":"%s","discount_saved":"%s","currency":"%s"}`,
		sessionID, orderID, itemsJSON, shippingCost, totalPaid, discountSaved, currency)

	ctx, cancel := context.WithTimeout(ctx, time.Second*2)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, strings.NewReader(jsonBody))
	if err != nil {
		return errors.Wrap(err, "failed to create save order request")
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return errors.Wrap(err, "failed to call order history service to save")
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		body, _ := ioutil.ReadAll(resp.Body)
		return fmt.Errorf("order history service returned status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}
