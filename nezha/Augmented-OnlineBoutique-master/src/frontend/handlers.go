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
	"html/template"
	"math/rand"

	//"net"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/pingcap/failpoint"
	"github.com/pkg/errors"
	"github.com/sirupsen/logrus"
	"go.opentelemetry.io/otel/trace"

	pb "github.com/GoogleCloudPlatform/microservices-demo/src/frontend/genproto"
	"github.com/GoogleCloudPlatform/microservices-demo/src/frontend/money"
)

type platformDetails struct {
	css      string
	provider string
}

var (
	templates = template.Must(template.New("").
			Funcs(template.FuncMap{
			"renderMoney":        renderMoney,
			"renderCurrencyLogo": renderCurrencyLogo,
		}).ParseGlob("templates/*.html"))
	plat platformDetails
)

// var validEnvs = []string{"local", "gcp", "azure", "aws", "onprem", "alibaba"}

func (fe *frontendServer) homeHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	span := trace.SpanFromContext(ctx)
	traceId := span.SpanContext().TraceID()
	spanId := span.SpanContext().SpanID()

	log := ctx.Value(ctxKeyLog{}).(logrus.FieldLogger)
	log.WithField("currency", currentCurrency(r)).Infof("TraceID: %v SpanID: %v Request home started", traceId, spanId)

	currencies, err := fe.getCurrencies(r.Context())
	if err != nil {
		log.Errorf("TraceID: %v SpanID: %v Could not retrieve currencies", traceId, spanId)
		renderHTTPError(log, r, w, errors.Wrap(err, "could not retrieve currencies"), http.StatusInternalServerError)
		return
	}
	products, err := fe.getProducts(r.Context())
	if err != nil {
		log.Errorf("TraceID: %v SpanID: %v Could not retrieve products", traceId, spanId)
		renderHTTPError(log, r, w, errors.Wrap(err, "could not retrieve products"), http.StatusInternalServerError)
		return
	}
	cart, err := fe.getCart(r.Context(), sessionID(r))
	if err != nil {
		log.Errorf("TraceID: %v SpanID: %v Could not retrieve cart", traceId, spanId)
		renderHTTPError(log, r, w, errors.Wrap(err, "could not retrieve cart"), http.StatusInternalServerError)
		return
	}

	type productView struct {
		Item  *pb.Product
		Price *pb.Money
	}
	ps := make([]productView, len(products))
	for i, p := range products {
		price, err := fe.convertCurrency(r.Context(), p.GetPriceUsd(), currentCurrency(r))
		if err != nil {
			log.Errorf("TraceID: %v SpanID: %v Failed to do currency conversion for product %v", traceId, spanId, p.GetId())
			renderHTTPError(log, r, w, errors.Wrapf(err, "failed to do currency conversion for product %s", p.GetId()), http.StatusInternalServerError)
			return
		}
		ps[i] = productView{p, price}
	}

	// // Set ENV_PLATFORM (default to local if not set; use env var if set; otherwise detect GCP, which overrides env)_
	// var env = os.Getenv("ENV_PLATFORM")
	// // Only override from env variable if set + valid env
	// if env == "" || stringinSlice(validEnvs, env) == false {
	// 	fmt.Println("env platform is either empty or invalid")
	// 	env = "local"
	// }
	// // Autodetect GCP
	// addrs, err := net.LookupHost("metadata.google.internal.")
	// if err == nil && len(addrs) >= 0 {
	// 	log.Debugf("Detected Google metadata server: %v, setting ENV_PLATFORM to GCP.", addrs)
	// 	env = "gcp"
	// }

	// log.Debugf("ENV_PLATFORM is: %s", env)
	env := "local"
	plat := platformDetails{}
	plat.setPlatformDetails(strings.ToLower(env))

	if err := templates.ExecuteTemplate(w, "home", map[string]interface{}{
		"session_id":    sessionID(r),
		"request_id":    r.Context().Value(ctxKeyRequestID{}),
		"user_currency": currentCurrency(r),
		"show_currency": true,
		"currencies":    currencies,
		"products":      ps,
		"cart_size":     cartSize(cart),
		"banner_color":  os.Getenv("BANNER_COLOR"), // illustrates canary deployments
		"ad":            fe.chooseAd(r.Context(), []string{}, log),
		"platform_css":  plat.css,
		"platform_name": plat.provider,
	}); err != nil {
		log.Error(err)
	}
	log.WithField("currency", currentCurrency(r)).Infof("TraceID: %v SpanID: %v Request home complete", traceId, spanId)
}

func (plat *platformDetails) setPlatformDetails(env string) {
	if env == "aws" {
		plat.provider = "AWS"
		plat.css = "aws-platform"
	} else if env == "onprem" {
		plat.provider = "On-Premises"
		plat.css = "onprem-platform"
	} else if env == "azure" {
		plat.provider = "Azure"
		plat.css = "azure-platform"
	} else if env == "gcp" {
		plat.provider = "Google Cloud"
		plat.css = "gcp-platform"
	} else if env == "alibaba" {
		plat.provider = "Alibaba Cloud"
		plat.css = "alibaba-platform"
	} else {
		plat.provider = "local"
		plat.css = "local"
	}
}

func (fe *frontendServer) productHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	span := trace.SpanFromContext(ctx)
	traceId := span.SpanContext().TraceID()
	spanId := span.SpanContext().SpanID()

	log := ctx.Value(ctxKeyLog{}).(logrus.FieldLogger)
	id := mux.Vars(r)["id"]

	log.WithField("id", id).WithField("currency", currentCurrency(r)).
		Infof("TraceID: %v SpanID: %v Serving product page started", traceId, spanId)
	/*
	 Inject modify return vaule Fault, trigger by FrontProductHandlerReturn flag
	*/
	if _, _err_ := failpoint.Eval(_curpkg_("FrontProductHandlerReturn")); _err_ == nil {
		id = ""
	}

	if id == "" {
		log.Errorf("TraceID: %v SpanID: %v Product id not specified", traceId, spanId)
		renderHTTPError(log, r, w, errors.New("product id not specified"), http.StatusBadRequest)
		return
	}

	p, err := fe.getProduct(r.Context(), id)
	if err != nil {
		log.Errorf("TraceID: %v SpanID: %v Could not retrieve product", traceId, spanId)
		renderHTTPError(log, r, w, errors.Wrap(err, "could not retrieve product"), http.StatusInternalServerError)
		return
	}
	currencies, err := fe.getCurrencies(r.Context())
	if err != nil {
		log.Errorf("TraceID: %v SpanID: %v Could not retrieve currencies", traceId, spanId)
		renderHTTPError(log, r, w, errors.Wrap(err, "could not retrieve currencies"), http.StatusInternalServerError)
		return
	}

	cart, err := fe.getCart(r.Context(), sessionID(r))
	if err != nil {
		log.Errorf("TraceID: %v SpanID: %v Could not retrieve cart", traceId, spanId)
		renderHTTPError(log, r, w, errors.Wrap(err, "could not retrieve cart"), http.StatusInternalServerError)
		return
	}

	price, err := fe.convertCurrency(r.Context(), p.GetPriceUsd(), currentCurrency(r))
	if err != nil {
		log.Errorf("TraceID: %v SpanID: %v Failed to convert currency", traceId, spanId)
		renderHTTPError(log, r, w, errors.Wrap(err, "failed to convert currency"), http.StatusInternalServerError)
		return
	}

	recommendations, err := fe.getRecommendations(r.Context(), sessionID(r), []string{id})
	if err != nil {
		log.Errorf("TraceID: %v SpanID: %v Failed to get product recommendations", traceId, spanId)
		renderHTTPError(log, r, w, errors.Wrap(err, "failed to get product recommendations"), http.StatusInternalServerError)
		return
	}

	product := struct {
		Item  *pb.Product
		Price *pb.Money
	}{p, price}

	// 加载该商品的评论
	comments, err := fe.getProductComments(r.Context(), id)
	if err != nil {
		log.Warnf("TraceID: %v SpanID: %v Failed to get comments: %v", traceId, spanId, err)
		comments = nil
	}

	if err := templates.ExecuteTemplate(w, "product", map[string]interface{}{
		"session_id":      sessionID(r),
		"request_id":      r.Context().Value(ctxKeyRequestID{}),
		"ad":              fe.chooseAd(r.Context(), p.Categories, log),
		"user_currency":   currentCurrency(r),
		"show_currency":   true,
		"currencies":      currencies,
		"product":         product,
		"recommendations": recommendations,
		"comments":        comments,
		"cart_size":       cartSize(cart),
		"platform_css":    plat.css,
		"platform_name":   plat.provider,
	}); err != nil {
		log.Println(err)
	}
	log.WithField("id", id).WithField("currency", currentCurrency(r)).
		Infof("TraceID: %v SpanID: %v Serving product page complete", traceId, spanId)
}

func (fe *frontendServer) addToCartHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	span := trace.SpanFromContext(ctx)
	traceId := span.SpanContext().TraceID()
	spanId := span.SpanContext().SpanID()

	log := r.Context().Value(ctxKeyLog{}).(logrus.FieldLogger)
	quantity, _ := strconv.ParseUint(r.FormValue("quantity"), 10, 32)
	productID := r.FormValue("product_id")
	if productID == "" || quantity == 0 {
		log.Errorf("TraceID: %v SpanID: %v Invalid form input", traceId, spanId)
		renderHTTPError(log, r, w, errors.New("invalid form input"), http.StatusBadRequest)
		return
	}
	log.WithField("product", productID).WithField("quantity", quantity).Infof("TraceID: %v SpanID: %v Adding to cart started", traceId, spanId)

	p, err := fe.getProduct(r.Context(), productID)
	if err != nil {
		log.Errorf("TraceID: %v SpanID: %v Failed to convert product", traceId, spanId)
		renderHTTPError(log, r, w, errors.Wrap(err, "could not retrieve product"), http.StatusInternalServerError)
		return
	}

	if err := fe.insertCart(r.Context(), sessionID(r), p.GetId(), int32(quantity)); err != nil {
		log.Errorf("TraceID: %v SpanID: %v Failed to add to cart", traceId, spanId)
		renderHTTPError(log, r, w, errors.Wrap(err, "failed to add to cart"), http.StatusInternalServerError)
		return
	}

	w.Header().Set("location", "/cart")
	w.WriteHeader(http.StatusFound)
	log.WithField("product", productID).WithField("quantity", quantity).Infof("TraceID: %v SpanID: %v Adding to cart complete", traceId, spanId)
}

func (fe *frontendServer) emptyCartHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	span := trace.SpanFromContext(ctx)
	traceId := span.SpanContext().TraceID()
	spanId := span.SpanContext().SpanID()

	log := ctx.Value(ctxKeyLog{}).(logrus.FieldLogger)
	log.Infof("TraceID: %v SpanID: %v Emptying cart started", traceId, spanId)

	if err := fe.emptyCart(r.Context(), sessionID(r)); err != nil {
		log.Errorf("TraceID: %v SpanID: %v Failed to empty cart", traceId, spanId)
		renderHTTPError(log, r, w, errors.Wrap(err, "failed to empty cart"), http.StatusInternalServerError)
		return
	}

	w.Header().Set("location", "/")
	w.WriteHeader(http.StatusFound)
	log.Infof("TraceID: %v SpanID: %v Emptying cart complete", traceId, spanId)
}

func (fe *frontendServer) addCommentHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	span := trace.SpanFromContext(ctx)
	traceId := span.SpanContext().TraceID()
	spanId := span.SpanContext().SpanID()

	log := ctx.Value(ctxKeyLog{}).(logrus.FieldLogger)
	productID := mux.Vars(r)["id"]

	userName := r.FormValue("user_name")
	content := r.FormValue("content")
	rating := r.FormValue("rating")

	if userName == "" {
		userName = "Anonymous"
	}
	if rating == "" {
		rating = "5"
	}

	log.Infof("TraceID: %v SpanID: %v Adding comment for product %s", traceId, spanId, productID)

	if err := fe.postComment(r.Context(), productID, userName, content, rating); err != nil {
		log.Warnf("TraceID: %v SpanID: %v Failed to post comment: %v", traceId, spanId, err)
	}

	// 重定向回商品详情页
	http.Redirect(w, r, "/product/"+productID, http.StatusFound)
}

func (fe *frontendServer) viewCartHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	span := trace.SpanFromContext(ctx)
	traceId := span.SpanContext().TraceID()
	spanId := span.SpanContext().SpanID()

	log := ctx.Value(ctxKeyLog{}).(logrus.FieldLogger)
	log.Infof("TraceID: %v SpanID: %v View user cart start", traceId, spanId)
	currencies, err := fe.getCurrencies(r.Context())
	if err != nil {
		log.Errorf("TraceID: %v SpanID: %v Could not retrieve currencies", traceId, spanId)
		renderHTTPError(log, r, w, errors.Wrap(err, "could not retrieve currencies"), http.StatusInternalServerError)
		return
	}
	cart, err := fe.getCart(r.Context(), sessionID(r))
	if err != nil {
		log.Errorf("TraceID: %v SpanID: %v Could not retrieve cart", traceId, spanId)
		renderHTTPError(log, r, w, errors.Wrap(err, "could not retrieve cart"), http.StatusInternalServerError)
		return
	}

	recommendations, err := fe.getRecommendations(r.Context(), sessionID(r), cartIDs(cart))
	if err != nil {
		log.Errorf("TraceID: %v SpanID: %v Failed to get product recommendations", traceId, spanId)
		renderHTTPError(log, r, w, errors.Wrap(err, "failed to get product recommendations"), http.StatusInternalServerError)
		return
	}

	shippingCost, err := fe.getShippingQuote(r.Context(), cart, currentCurrency(r))
	if err != nil {
		log.Errorf("TraceID: %v SpanID: %v Failed to get shipping quote", traceId, spanId)
		renderHTTPError(log, r, w, errors.Wrap(err, "failed to get shipping quote"), http.StatusInternalServerError)
		return
	}

	type cartItemView struct {
		Item     *pb.Product
		Quantity int32
		Price    *pb.Money
	}
	items := make([]cartItemView, len(cart))
	totalPrice := pb.Money{CurrencyCode: currentCurrency(r)}
	for i, item := range cart {
		p, err := fe.getProduct(r.Context(), item.GetProductId())
		if err != nil {
			log.Errorf("TraceID: %v SpanID: %v Could not retrieve product #%s", traceId, spanId, item.GetProductId())
			renderHTTPError(log, r, w, errors.Wrapf(err, "could not retrieve product #%s", item.GetProductId()), http.StatusInternalServerError)
			return
		}
		price, err := fe.convertCurrency(r.Context(), p.GetPriceUsd(), currentCurrency(r))
		if err != nil {
			log.Errorf("TraceID: %v SpanID: %v Could not convert currency for product #%s", traceId, spanId, item.GetProductId())
			renderHTTPError(log, r, w, errors.Wrapf(err, "could not convert currency for product #%s", item.GetProductId()), http.StatusInternalServerError)
			return
		}

		multPrice := money.MultiplySlow(*price, uint32(item.GetQuantity()))
		items[i] = cartItemView{
			Item:     p,
			Quantity: item.GetQuantity(),
			Price:    &multPrice}
		totalPrice = money.Must(money.Sum(totalPrice, multPrice))
	}
	totalPrice = money.Must(money.Sum(totalPrice, *shippingCost))

	// 调用 VIP 折扣服务
	totalFloat := moneyToFloat(&totalPrice)
	vipDiscountedPrice := &totalPrice
	discountAmount := pb.Money{CurrencyCode: currentCurrency(r)}
	if discountResp, err := fe.getVIPDiscount(r.Context(), totalFloat); err != nil {
		log.Warnf("TraceID: %v SpanID: %v Failed to get VIP discount: %v", traceId, spanId, err)
	} else {
		vipDiscountedPrice = floatToMoney(discountResp.DiscountedPrice, currentCurrency(r))
		saved := totalFloat - discountResp.DiscountedPrice
		discountAmount = *floatToMoney(saved, currentCurrency(r))
		log.Infof("TraceID: %v SpanID: %v VIP discount applied: original=%.2f, discounted=%.2f", traceId, spanId, totalFloat, discountResp.DiscountedPrice)
	}

	// 优惠券处理（在 VIP 折扣基础上叠加）
	couponCode := r.URL.Query().Get("coupon")
	couponDiscount := pb.Money{CurrencyCode: currentCurrency(r)}
	couponCodeDisplay := ""
	couponDesc := ""
	finalPrice := vipDiscountedPrice
	if couponCode != "" {
		vipFloat := moneyToFloat(vipDiscountedPrice)
		if cr, err := fe.validateCoupon(r.Context(), couponCode, vipFloat); err != nil {
			log.Warnf("TraceID: %v SpanID: %v Failed to validate coupon: %v", traceId, spanId, err)
		} else if cr.Valid {
			couponDiscount = *floatToMoney(cr.Discount, currentCurrency(r))
			finalPrice = floatToMoney(cr.FinalPrice, currentCurrency(r))
			couponCodeDisplay = cr.Code
			couponDesc = cr.Desc
			log.Infof("TraceID: %v SpanID: %v Coupon applied: code=%s discount=%.2f final=%.2f", traceId, spanId, couponCode, cr.Discount, cr.FinalPrice)
		}
	}

	year := time.Now().Year()

	// 检查是否有促销图片
	hasPromoImage := false
	if promoInfo, err := fe.getPromoImageURL(r.Context()); err == nil && promoInfo.URL != "" {
		hasPromoImage = true
	}

	// 获取可用优惠券列表
	couponList, _ := fe.getCouponList(r.Context())

	if err := templates.ExecuteTemplate(w, "cart", map[string]interface{}{
		"session_id":         sessionID(r),
		"request_id":         r.Context().Value(ctxKeyRequestID{}),
		"user_currency":      currentCurrency(r),
		"currencies":         currencies,
		"recommendations":    recommendations,
		"cart_size":          cartSize(cart),
		"shipping_cost":      shippingCost,
		"show_currency":      true,
		"total_cost":         totalPrice,
		"vip_discounted":     vipDiscountedPrice,
		"discount_amount":    &discountAmount,
		"items":                items,
		"expiration_years":     []int{year, year + 1, year + 2, year + 3, year + 4},
		"has_promo_image":      hasPromoImage,
		"coupon_code":          couponCodeDisplay,
		"coupon_desc":          couponDesc,
		"coupon_discount":      &couponDiscount,
		"final_price":          finalPrice,
		"coupon_list":          couponList,
		"platform_css":         plat.css,
		"platform_name":        plat.provider,
	}); err != nil {
		log.Println(err)
	}
	log.Infof("TraceID: %v SpanID: %v View user cart complete", traceId, spanId)
}

func (fe *frontendServer) placeOrderHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	span := trace.SpanFromContext(ctx)
	traceId := span.SpanContext().TraceID()
	spanId := span.SpanContext().SpanID()

	log := ctx.Value(ctxKeyLog{}).(logrus.FieldLogger)
	log.Infof("TraceID: %v SpanID: %v Placing order started", traceId, spanId)

	var (
		email         = r.FormValue("email")
		streetAddress = r.FormValue("street_address")
		zipCode, _    = strconv.ParseInt(r.FormValue("zip_code"), 10, 32)
		city          = r.FormValue("city")
		state         = r.FormValue("state")
		country       = r.FormValue("country")
		ccNumber      = r.FormValue("credit_card_number")
		ccMonth, _    = strconv.ParseInt(r.FormValue("credit_card_expiration_month"), 10, 32)
		ccYear, _     = strconv.ParseInt(r.FormValue("credit_card_expiration_year"), 10, 32)
		ccCVV, _      = strconv.ParseInt(r.FormValue("credit_card_cvv"), 10, 32)
	)

	order, err := pb.NewCheckoutServiceClient(fe.checkoutSvcConn).
		PlaceOrder(r.Context(), &pb.PlaceOrderRequest{
			Email: email,
			CreditCard: &pb.CreditCardInfo{
				CreditCardNumber:          ccNumber,
				CreditCardExpirationMonth: int32(ccMonth),
				CreditCardExpirationYear:  int32(ccYear),
				CreditCardCvv:             int32(ccCVV)},
			UserId:       sessionID(r),
			UserCurrency: currentCurrency(r),
			Address: &pb.Address{
				StreetAddress: streetAddress,
				City:          city,
				State:         state,
				ZipCode:       int32(zipCode),
				Country:       country},
		})

	/*
	  Inject Exception Fault, trigger by FrontPlaceOrderHandlerException flag
	*/
	if _, _err_ := failpoint.Eval(_curpkg_("FrontPlaceOrderHandlerException")); _err_ == nil {
		err = fmt.Errorf("Place order error.")
	}

	if err != nil {
		log.Errorf("TraceID: %v SpanID: %v Failed to complete the order", traceId, spanId)
		renderHTTPError(log, r, w, errors.Wrap(err, "failed to complete the order"), http.StatusInternalServerError)
		return
	}
	log.WithField("order", order.GetOrder().GetOrderId()).Infof("TraceID: %v SpanID: %v Order placed complete", traceId, spanId)

	order.GetOrder().GetItems()
	recommendations, _ := fe.getRecommendations(r.Context(), sessionID(r), nil)

	totalPaid := *order.GetOrder().GetShippingCost()
	// 构建订单商品 JSON 用于历史记录
	type orderItemForHistory struct {
		ProductID string `json:"product_id"`
		Quantity  int32  `json:"quantity"`
	}
	var itemsForHistory []orderItemForHistory
	for _, v := range order.GetOrder().GetItems() {
		multPrice := money.MultiplySlow(*v.GetCost(), uint32(v.GetItem().GetQuantity()))
		totalPaid = money.Must(money.Sum(totalPaid, multPrice))
		itemsForHistory = append(itemsForHistory, orderItemForHistory{
			ProductID: v.GetItem().GetProductId(),
			Quantity:  v.GetItem().GetQuantity(),
		})
	}
	itemsJSONBytes, _ := json.Marshal(itemsForHistory)
	itemsJSON := string(itemsJSONBytes)

	// 调用 VIP 折扣服务获取订单折扣信息
	totalFloat := moneyToFloat(&totalPaid)
	vipDiscountedPaid := &totalPaid
	discountSaved := pb.Money{CurrencyCode: currentCurrency(r)}
	if discountResp, err := fe.getVIPDiscount(r.Context(), totalFloat); err != nil {
		log.Warnf("TraceID: %v SpanID: %v Failed to get VIP discount for order: %v", traceId, spanId, err)
	} else {
		vipDiscountedPaid = floatToMoney(discountResp.DiscountedPrice, currentCurrency(r))
		saved := totalFloat - discountResp.DiscountedPrice
		discountSaved = *floatToMoney(saved, currentCurrency(r))
	}

	currencies, err := fe.getCurrencies(r.Context())
	if err != nil {
		log.Errorf("TraceID: %v SpanID: %v Could not retrieve currencies", traceId, spanId)
		renderHTTPError(log, r, w, errors.Wrap(err, "could not retrieve currencies"), http.StatusInternalServerError)
		return
	}

	// 记录订单到历史服务
	go func() {
		bgCtx := context.Background()
		sid := sessionID(r)
		oid := order.GetOrder().GetOrderId()
		sc := renderMoney(*order.GetOrder().GetShippingCost())
		tp := renderMoney(totalPaid)
		ds := renderMoney(discountSaved)
		cur := currentCurrency(r)
		if saveErr := fe.saveOrderToHistory(bgCtx, sid, oid, itemsJSON, sc, tp, ds, cur); saveErr != nil {
			log.Warnf("TraceID: %v SpanID: %v Failed to save order to history: %v", traceId, spanId, saveErr)
		}
	}()

	if err := templates.ExecuteTemplate(w, "order", map[string]interface{}{
		"session_id":          sessionID(r),
		"request_id":          r.Context().Value(ctxKeyRequestID{}),
		"user_currency":       currentCurrency(r),
		"show_currency":       false,
		"currencies":          currencies,
		"order":               order.GetOrder(),
		"total_paid":          &totalPaid,
		"vip_discounted_paid": vipDiscountedPaid,
		"discount_saved":      &discountSaved,
		"recommendations":     recommendations,
		"platform_css":        plat.css,
		"platform_name":       plat.provider,
	}); err != nil {
		log.Println(err)
	}
}

func (fe *frontendServer) viewOrderHistoryHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	span := trace.SpanFromContext(ctx)
	traceId := span.SpanContext().TraceID()
	spanId := span.SpanContext().SpanID()

	log := ctx.Value(ctxKeyLog{}).(logrus.FieldLogger)
	log.Infof("TraceID: %v SpanID: %v View order history started", traceId, spanId)

	orders, err := fe.getOrderHistory(r.Context(), sessionID(r))
	if err != nil {
		log.Warnf("TraceID: %v SpanID: %v Failed to get order history: %v", traceId, spanId, err)
		orders = nil
	}

	// 解析 items_json 为模板友好的结构
	type orderItemDisplay struct {
		ProductID   string
		ProductName string
		Picture     string
		Quantity    int32
	}
	type orderDisplay struct {
		OrderID       string
		CreatedAt     string
		ShippingCost  string
		TotalPaid     string
		DiscountSaved string
		Items         []orderItemDisplay
	}
	var displayOrders []orderDisplay
	for _, o := range orders {
		od := orderDisplay{
			OrderID:       o.OrderID,
			CreatedAt:     o.CreatedAt,
			ShippingCost:  o.ShippingCost,
			TotalPaid:     o.TotalPaid,
			DiscountSaved: o.DiscountSaved,
		}
		// 解析 JSON 并查找产品信息
		var rawItems []struct {
			ProductID string `json:"product_id"`
			Quantity  int32  `json:"quantity"`
		}
		if err := json.Unmarshal([]byte(o.ItemsJSON), &rawItems); err == nil {
			for _, ri := range rawItems {
				item := orderItemDisplay{
					ProductID:   ri.ProductID,
					ProductName: ri.ProductID, // fallback
					Quantity:    ri.Quantity,
				}
				// 查找产品信息
				if p, err := fe.getProduct(r.Context(), ri.ProductID); err == nil {
					item.ProductName = p.GetName()
					item.Picture = p.GetPicture()
				}
				od.Items = append(od.Items, item)
			}
		}
		displayOrders = append(displayOrders, od)
	}

	cart, err := fe.getCart(r.Context(), sessionID(r))
	if err != nil {
		log.Warnf("TraceID: %v SpanID: %v Failed to get cart: %v", traceId, spanId, err)
	}

	currencies, err := fe.getCurrencies(r.Context())
	if err != nil {
		log.Errorf("TraceID: %v SpanID: %v Could not retrieve currencies", traceId, spanId)
		renderHTTPError(log, r, w, errors.Wrap(err, "could not retrieve currencies"), http.StatusInternalServerError)
		return
	}

	if err := templates.ExecuteTemplate(w, "order-history", map[string]interface{}{
		"session_id":    sessionID(r),
		"request_id":    r.Context().Value(ctxKeyRequestID{}),
		"user_currency": currentCurrency(r),
		"show_currency": true,
		"currencies":    currencies,
		"orders":        displayOrders,
		"cart_size":     cartSize(cart),
		"platform_css":  plat.css,
		"platform_name": plat.provider,
	}); err != nil {
		log.Println(err)
	}
	log.Infof("TraceID: %v SpanID: %v View order history complete", traceId, spanId)
}

func (fe *frontendServer) logoutHandler(w http.ResponseWriter, r *http.Request) {
	log := r.Context().Value(ctxKeyLog{}).(logrus.FieldLogger)
	log.Debug("logging out")
	for _, c := range r.Cookies() {
		c.Expires = time.Now().Add(-time.Hour * 24 * 365)
		c.MaxAge = -1
		http.SetCookie(w, c)
	}
	w.Header().Set("Location", "/")
	w.WriteHeader(http.StatusFound)
}

func (fe *frontendServer) setCurrencyHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	span := trace.SpanFromContext(ctx)
	traceId := span.SpanContext().TraceID()
	spanId := span.SpanContext().SpanID()

	log := ctx.Value(ctxKeyLog{}).(logrus.FieldLogger)
	cur := r.FormValue("currency_code")
	log.WithField("curr.new", cur).WithField("curr.old", currentCurrency(r)).Infof("TraceID: %v SpanID: %v Setting currency started", traceId, spanId)

	if cur != "" {
		http.SetCookie(w, &http.Cookie{
			Name:   cookieCurrency,
			Value:  cur,
			MaxAge: cookieMaxAge,
		})
	}
	referer := r.Header.Get("referer")
	if referer == "" {
		referer = "/"
	}
	w.Header().Set("Location", referer)
	w.WriteHeader(http.StatusFound)
	log.WithField("curr.new", cur).WithField("curr.old", currentCurrency(r)).Infof("TraceID: %v SpanID: %v Setting currency complete", traceId, spanId)
}

// promoImageHandler 代理 image-show-service 的图片到浏览器
func (fe *frontendServer) promoImageHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	span := trace.SpanFromContext(ctx)
	traceId := span.SpanContext().TraceID()
	spanId := span.SpanContext().SpanID()

	log := ctx.Value(ctxKeyLog{}).(logrus.FieldLogger)

	info, err := fe.getPromoImageURL(ctx)
	if err != nil || info.URL == "" {
		log.Warnf("TraceID: %v SpanID: %v Failed to get promo image: %v", traceId, spanId, err)
		http.NotFound(w, r)
		return
	}

	imgBytes, contentType, err := fe.getPromoImageBytes(ctx, info.URL)
	if err != nil {
		log.Warnf("TraceID: %v SpanID: %v Failed to get promo image bytes: %v", traceId, spanId, err)
		http.NotFound(w, r)
		return
	}

	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Cache-Control", "no-cache")
	w.Write(imgBytes)
}

// chooseAd queries for advertisements available and randomly chooses one, if
// available. It ignores the error retrieving the ad since it is not critical.
func (fe *frontendServer) chooseAd(ctx context.Context, ctxKeys []string, log logrus.FieldLogger) *pb.Ad {
	span := trace.SpanFromContext(ctx)
	traceId := span.SpanContext().TraceID()
	spanId := span.SpanContext().SpanID()

	log.Infof("TraceID: %v SpanID: %v Choose Ad started", traceId, spanId)
	ads, err := fe.getAd(ctx, ctxKeys)

	/*
	   Inject cpu consume fault, trigger by FrontChooseAdCPU flag
	*/
	if _, _err_ := failpoint.Eval(_curpkg_("FrontChooseAdCPU")); _err_ == nil {
		start := time.Now()
		for {
			// break for after duration
			if time.Now().Sub(start).Milliseconds() > 800 {
				break
			}
		}
	}

	if err != nil {
		// log.Warnf("TraceID: %v SpanID: %v failed to retrieve ads", traceId, spanId)
		log.WithField("error", err).Warnf("TraceID: %v SpanID: %v Failed to retrieve ads", traceId, spanId)
		return nil
	}
	ad := ads[rand.Intn(len(ads))]
	log.Infof("TraceID: %v SpanID: %v Choose Ad complete", traceId, spanId)
	return ad
}

func renderHTTPError(log logrus.FieldLogger, r *http.Request, w http.ResponseWriter, err error, code int) {
	ctx := r.Context()
	span := trace.SpanFromContext(ctx)
	traceId := span.SpanContext().TraceID()
	spanId := span.SpanContext().SpanID()
	log.WithField("error", err).Errorf("TraceID: %v, SpanID: %v Request error", traceId, spanId)
	errMsg := fmt.Sprintf("%+v", err)

	w.WriteHeader(code)
	if templateErr := templates.ExecuteTemplate(w, "error", map[string]interface{}{
		"session_id":  sessionID(r),
		"request_id":  r.Context().Value(ctxKeyRequestID{}),
		"error":       errMsg,
		"status_code": code,
		"status":      http.StatusText(code),
	}); templateErr != nil {
		log.Println(templateErr)
	}
}

func currentCurrency(r *http.Request) string {
	c, _ := r.Cookie(cookieCurrency)
	if c != nil {
		return c.Value
	}
	return defaultCurrency
}

func sessionID(r *http.Request) string {
	v := r.Context().Value(ctxKeySessionID{})
	if v != nil {
		return v.(string)
	}
	return ""
}

func cartIDs(c []*pb.CartItem) []string {
	out := make([]string, len(c))
	for i, v := range c {
		out[i] = v.GetProductId()
	}
	return out
}

// get total # of items in cart
func cartSize(c []*pb.CartItem) int {
	cartSize := 0
	for _, item := range c {
		cartSize += int(item.GetQuantity())
	}
	return cartSize
}

func renderMoney(money pb.Money) string {
	return fmt.Sprintf("%s %d.%02d", money.GetCurrencyCode(), money.GetUnits(), money.GetNanos()/10000000)
}

func renderCurrencyLogo(currencyCode string) string {
	logos := map[string]string{
		"USD": "$",
		"CAD": "$",
		"JPY": "¥",
		"EUR": "€",
		"TRY": "₺",
		"GBP": "£",
	}

	logo := "$" //default
	if val, ok := logos[currencyCode]; ok {
		logo = val
	}
	return logo
}

func stringinSlice(slice []string, val string) bool {
	for _, item := range slice {
		if item == val {
			return true
		}
	}
	return false
}
